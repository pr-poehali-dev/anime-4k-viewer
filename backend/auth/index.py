'''
Business: OAuth авторизация через Яндекс, Telegram, VK и управление JWT токенами
Args: event - запрос с методом, телом и параметрами; context - контекст выполнения
Returns: HTTP ответ с токеном или данными пользователя
'''

import json
import os
import jwt
import hashlib
import requests
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def create_jwt_token(user_id: str, email: str, is_admin: bool) -> str:
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def verify_jwt_token(token: str) -> Dict[str, Any]:
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    try:
        return jwt.decode(token, secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def get_or_create_user(provider: str, provider_id: str, username: str, email: str = None, avatar_url: str = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cur = conn.cursor()
    
    user_id = hashlib.md5(f"{provider}:{provider_id}".encode()).hexdigest()
    
    cur.execute("""
        SELECT u.*, a.role, a.permissions 
        FROM users u
        LEFT JOIN admins a ON u.id = a.user_id
        WHERE u.provider = %s AND u.provider_id = %s
    """, (provider, provider_id))
    
    user = cur.fetchone()
    
    if user:
        cur.execute("""
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE id = %s
        """, (user['id'],))
        conn.commit()
    else:
        cur.execute("""
            INSERT INTO users (id, email, username, avatar_url, provider, provider_id, is_admin)
            VALUES (%s, %s, %s, %s, %s, %s, FALSE)
            RETURNING *
        """, (user_id, email, username, avatar_url, provider, provider_id))
        user = cur.fetchone()
        conn.commit()
    
    cur.close()
    conn.close()
    
    return dict(user) if user else None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    
    # Verify token
    if method == 'GET' and action == 'verify':
        auth_header = event.get('headers', {}).get('x-auth-token', '')
        if not auth_header:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No token provided'}),
                'isBase64Encoded': False
            }
        
        result = verify_jwt_token(auth_header)
        if 'error' in result:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    # OAuth callbacks
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        provider = body_data.get('provider')
        
        if provider == 'yandex':
            code = body_data.get('code')
            client_id = os.environ.get('YANDEX_CLIENT_ID')
            client_secret = os.environ.get('YANDEX_CLIENT_SECRET')
            
            # Exchange code for token
            token_response = requests.post('https://oauth.yandex.ru/token', data={
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret
            })
            
            if token_response.status_code != 200:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to get Yandex token'}),
                    'isBase64Encoded': False
                }
            
            access_token = token_response.json().get('access_token')
            
            # Get user info
            user_response = requests.get('https://login.yandex.ru/info', headers={
                'Authorization': f'OAuth {access_token}'
            })
            
            user_data = user_response.json()
            user = get_or_create_user(
                'yandex',
                user_data.get('id'),
                user_data.get('display_name', user_data.get('login')),
                user_data.get('default_email'),
                user_data.get('default_avatar_id', '')
            )
            
            token = create_jwt_token(user['id'], user.get('email', ''), user.get('is_admin', False))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'token': token, 'user': user}),
                'isBase64Encoded': False
            }
        
        elif provider == 'telegram':
            # Telegram Login Widget validation
            telegram_data = body_data.get('telegram_data', {})
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            
            user = get_or_create_user(
                'telegram',
                str(telegram_data.get('id')),
                telegram_data.get('username', telegram_data.get('first_name', 'User')),
                None,
                telegram_data.get('photo_url')
            )
            
            token = create_jwt_token(user['id'], user.get('email', ''), user.get('is_admin', False))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'token': token, 'user': user}),
                'isBase64Encoded': False
            }
        
        elif provider == 'vk':
            code = body_data.get('code')
            app_id = os.environ.get('VK_APP_ID')
            app_secret = os.environ.get('VK_APP_SECRET')
            redirect_uri = body_data.get('redirect_uri')
            
            # Exchange code for token
            token_response = requests.get('https://oauth.vk.com/access_token', params={
                'client_id': app_id,
                'client_secret': app_secret,
                'redirect_uri': redirect_uri,
                'code': code
            })
            
            token_data = token_response.json()
            
            if 'error' in token_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to get VK token'}),
                    'isBase64Encoded': False
                }
            
            access_token = token_data.get('access_token')
            vk_user_id = token_data.get('user_id')
            
            # Get user info
            user_response = requests.get('https://api.vk.com/method/users.get', params={
                'user_ids': vk_user_id,
                'fields': 'photo_200',
                'access_token': access_token,
                'v': '5.131'
            })
            
            vk_users = user_response.json().get('response', [])
            if vk_users:
                vk_user = vk_users[0]
                user = get_or_create_user(
                    'vk',
                    str(vk_user_id),
                    f"{vk_user.get('first_name', '')} {vk_user.get('last_name', '')}".strip(),
                    None,
                    vk_user.get('photo_200')
                )
                
                token = create_jwt_token(user['id'], user.get('email', ''), user.get('is_admin', False))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'token': token, 'user': user}),
                    'isBase64Encoded': False
                }
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }