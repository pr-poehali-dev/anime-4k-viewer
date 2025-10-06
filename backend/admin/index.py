'''
Business: Управление настройками сайта, добавление/удаление админов
Args: event - запрос с методом и токеном; context - контекст выполнения
Returns: HTTP ответ с настройками сайта или результатом операции
'''

import json
import os
import jwt
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def verify_admin(token: str) -> Dict[str, Any]:
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        if not payload.get('is_admin'):
            return {'error': 'Not an admin'}
        return payload
    except:
        return {'error': 'Invalid token'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_token = event.get('headers', {}).get('x-auth-token', '')
    admin_check = verify_admin(auth_token)
    
    if 'error' in admin_check:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    
    # Get all settings
    if method == 'GET' and action == 'settings':
        cur.execute("SELECT * FROM site_settings")
        settings = cur.fetchall()
        cur.close()
        conn.close()
        
        settings_dict = {s['setting_key']: s['setting_value'] for s in settings}
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'settings': settings_dict}),
            'isBase64Encoded': False
        }
    
    # Update setting
    if method == 'PUT' and action == 'settings':
        body_data = json.loads(event.get('body', '{}'))
        setting_key = body_data.get('key')
        setting_value = body_data.get('value')
        user_id = admin_check.get('user_id')
        
        cur.execute("""
            INSERT INTO site_settings (setting_key, setting_value, updated_by)
            VALUES (%s, %s, %s)
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP
        """, (setting_key, json.dumps(setting_value), user_id, json.dumps(setting_value), user_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    # Add admin
    if method == 'POST' and action == 'add-admin':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        role = body_data.get('role', 'admin')
        
        cur.execute("UPDATE users SET is_admin = TRUE WHERE id = %s", (user_id,))
        cur.execute("""
            INSERT INTO admins (user_id, role)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE SET role = %s
        """, (user_id, role, role))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    # Get all users
    if method == 'GET' and action == 'users':
        cur.execute("""
            SELECT u.*, a.role, a.permissions 
            FROM users u
            LEFT JOIN admins a ON u.id = a.user_id
            ORDER BY u.created_at DESC
        """)
        users = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'users': [dict(u) for u in users]}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid request'}),
        'isBase64Encoded': False
    }