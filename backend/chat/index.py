'''
Business: Система общего чата для пользователей с поддержкой отправки и получения сообщений
Args: event - запрос с методом и параметрами; context - контекст выполнения
Returns: HTTP ответ с сообщениями или статусом операции
'''

import json
import os
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def verify_token(event: Dict) -> Dict[str, Any]:
    import jwt
    token = event.get('headers', {}).get('x-auth-token', '')
    if not token:
        return {'error': 'No token provided'}
    
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    user_data = verify_token(event)
    if 'error' in user_data:
        return {
            'statusCode': 401,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'get_messages')
        limit = int(query_params.get('limit', '50'))
        
        if action == 'get_messages':
            cur.execute('''
                SELECT id, user_id, username, avatar_url, message, created_at
                FROM chat_messages
                WHERE is_active = TRUE
                ORDER BY created_at DESC
                LIMIT %s
            ''', (limit,))
            
            messages = [dict(row) for row in cur.fetchall()]
            messages.reverse()
            
            for msg in messages:
                if msg['created_at']:
                    msg['created_at'] = msg['created_at'].isoformat()
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', '')
        
        if action == 'send_message':
            message = body_data.get('message', '').strip()
            
            if not message:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Сообщение не может быть пустым'}),
                    'isBase64Encoded': False
                }
            
            if len(message) > 500:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Сообщение слишком длинное (макс. 500 символов)'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT id, username, avatar_url
                FROM users
                WHERE id = %s
            ''', (user_data['user_id'],))
            
            user = cur.fetchone()
            if not user:
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            message_id = str(uuid.uuid4())
            now = datetime.now()
            
            cur.execute('''
                INSERT INTO chat_messages (id, user_id, username, avatar_url, message, created_at, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, user_id, username, avatar_url, message, created_at
            ''', (message_id, user['id'], user['username'], user['avatar_url'], message, now, True))
            
            new_message = dict(cur.fetchone())
            if new_message['created_at']:
                new_message['created_at'] = new_message['created_at'].isoformat()
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'message': new_message, 'success': True}),
                'isBase64Encoded': False
            }
    
    conn.close()
    return {
        'statusCode': 400,
        'headers': cors_headers,
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }
