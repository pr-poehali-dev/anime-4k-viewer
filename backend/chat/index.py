'''
Business: Система чата с поддержкой общего чата, приватных сообщений и управления друзьями
Args: event - запрос с методом и параметрами; context - контекст выполнения
Returns: HTTP ответ с сообщениями, друзьями или статусом операции
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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
        
        if action == 'get_messages':
            limit = int(query_params.get('limit', '50'))
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
        
        elif action == 'get_private_messages':
            friend_id = query_params.get('friend_id')
            if not friend_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'friend_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT id, sender_id, recipient_id, message, created_at, is_read
                FROM private_messages
                WHERE (sender_id = %s AND recipient_id = %s)
                   OR (sender_id = %s AND recipient_id = %s)
                ORDER BY created_at ASC
                LIMIT 100
            ''', (user_data['user_id'], friend_id, friend_id, user_data['user_id']))
            
            messages = [dict(row) for row in cur.fetchall()]
            for msg in messages:
                if msg['created_at']:
                    msg['created_at'] = msg['created_at'].isoformat()
            
            cur.execute('''
                UPDATE private_messages
                SET is_read = TRUE
                WHERE recipient_id = %s AND sender_id = %s AND is_read = FALSE
            ''', (user_data['user_id'], friend_id))
            conn.commit()
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_friends':
            cur.execute('''
                SELECT u.id, u.username, u.avatar_url, f.status, f.created_at
                FROM friends f
                JOIN users u ON (f.friend_id = u.id)
                WHERE f.user_id = %s AND f.status = 'accepted'
                ORDER BY u.username ASC
            ''', (user_data['user_id'],))
            
            friends = [dict(row) for row in cur.fetchall()]
            for friend in friends:
                if friend['created_at']:
                    friend['created_at'] = friend['created_at'].isoformat()
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'friends': friends}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_friend_requests':
            cur.execute('''
                SELECT u.id, u.username, u.avatar_url, f.created_at, f.status
                FROM friends f
                JOIN users u ON (f.user_id = u.id)
                WHERE f.friend_id = %s AND f.status = 'pending'
                ORDER BY f.created_at DESC
            ''', (user_data['user_id'],))
            
            requests = [dict(row) for row in cur.fetchall()]
            for req in requests:
                if req['created_at']:
                    req['created_at'] = req['created_at'].isoformat()
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'requests': requests}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_all_users':
            cur.execute('''
                SELECT id, username, avatar_url, is_admin
                FROM users
                WHERE id != %s
                ORDER BY username ASC
            ''', (user_data['user_id'],))
            
            users = [dict(row) for row in cur.fetchall()]
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'users': users}),
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
        
        elif action == 'send_private_message':
            recipient_id = body_data.get('recipient_id', '').strip()
            message = body_data.get('message', '').strip()
            
            if not message or not recipient_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Сообщение и ID получателя обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(message) > 500:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Сообщение слишком длинное'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT COUNT(*) as cnt FROM friends
                WHERE ((user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s))
                  AND status = 'accepted'
            ''', (user_data['user_id'], recipient_id, recipient_id, user_data['user_id']))
            
            friendship = cur.fetchone()
            if friendship['cnt'] == 0:
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Вы не друзья с этим пользователем'}),
                    'isBase64Encoded': False
                }
            
            now = datetime.now()
            cur.execute('''
                INSERT INTO private_messages (sender_id, recipient_id, message, created_at, is_read)
                VALUES (%s, %s, %s, %s, FALSE)
                RETURNING id, sender_id, recipient_id, message, created_at, is_read
            ''', (user_data['user_id'], recipient_id, message, now))
            
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
        
        elif action == 'add_friend':
            friend_id = body_data.get('friend_id', '').strip()
            
            if not friend_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'friend_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            if friend_id == user_data['user_id']:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Нельзя добавить себя в друзья'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT COUNT(*) as cnt FROM friends
                WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)
            ''', (user_data['user_id'], friend_id, friend_id, user_data['user_id']))
            
            existing = cur.fetchone()
            if existing['cnt'] > 0:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заявка уже отправлена или вы уже друзья'}),
                    'isBase64Encoded': False
                }
            
            now = datetime.now()
            cur.execute('''
                INSERT INTO friends (user_id, friend_id, status, created_at)
                VALUES (%s, %s, 'pending', %s)
            ''', (user_data['user_id'], friend_id, now))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'message': 'Заявка отправлена'}),
                'isBase64Encoded': False
            }
        
        elif action == 'accept_friend':
            friend_id = body_data.get('friend_id', '').strip()
            
            if not friend_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'friend_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE friends
                SET status = 'accepted'
                WHERE user_id = %s AND friend_id = %s AND status = 'pending'
            ''', (friend_id, user_data['user_id']))
            
            if cur.rowcount == 0:
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заявка не найдена'}),
                    'isBase64Encoded': False
                }
            
            now = datetime.now()
            cur.execute('''
                INSERT INTO friends (user_id, friend_id, status, created_at)
                VALUES (%s, %s, 'accepted', %s)
                ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'accepted'
            ''', (user_data['user_id'], friend_id, now))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'message': 'Заявка принята'}),
                'isBase64Encoded': False
            }
        
        elif action == 'reject_friend':
            friend_id = body_data.get('friend_id', '').strip()
            
            if not friend_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'friend_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE friends
                SET status = 'rejected'
                WHERE user_id = %s AND friend_id = %s AND status = 'pending'
            ''', (friend_id, user_data['user_id']))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'message': 'Заявка отклонена'}),
                'isBase64Encoded': False
            }
    
    elif method == 'DELETE':
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        if action == 'remove_friend':
            friend_id = query_params.get('friend_id', '').strip()
            
            if not friend_id:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'friend_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE friends
                SET status = 'removed'
                WHERE (user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)
            ''', (user_data['user_id'], friend_id, friend_id, user_data['user_id']))
            
            conn.commit()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'message': 'Друг удален'}),
                'isBase64Encoded': False
            }
    
    conn.close()
    return {
        'statusCode': 400,
        'headers': cors_headers,
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }
