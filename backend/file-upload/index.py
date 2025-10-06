'''
Business: Загрузка файлов (изображений, видео) для аниме и баннеров
Args: event - запрос с файлом в base64; context - контекст выполнения
Returns: HTTP ответ с URL загруженного файла
'''

import json
import os
import base64
import hashlib
import secrets
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL')

ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

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
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
    
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        
        if method == 'POST':
            return handle_upload(conn, event, cors_headers)
        elif method == 'GET':
            return handle_get_files(conn, event, cors_headers)
        elif method == 'DELETE':
            return handle_delete(conn, event, cors_headers)
            
        return error_response('Метод не поддерживается', 405, cors_headers)
        
    except Exception as e:
        return error_response(f'Ошибка сервера: {str(e)}', 500, cors_headers)
    finally:
        if 'conn' in locals():
            conn.close()

def handle_upload(conn: Any, event: Dict, headers: Dict) -> Dict:
    auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    
    if not auth_token:
        return error_response('Требуется авторизация', 401, headers)
    
    user = verify_user(conn, auth_token)
    if not user:
        return error_response('Недействительный токен', 401, headers)
    
    body = json.loads(event.get('body', '{}'))
    file_data = body.get('file')
    file_name = body.get('filename', 'file')
    file_type = body.get('filetype', 'application/octet-stream')
    entity_type = body.get('entity_type')
    entity_id = body.get('entity_id')
    
    if not file_data:
        return error_response('Файл не предоставлен', 400, headers)
    
    # Проверка типа файла
    if file_type.startswith('image/') and file_type not in ALLOWED_IMAGE_TYPES:
        return error_response('Неподдерживаемый формат изображения', 400, headers)
    
    if file_type.startswith('video/') and file_type not in ALLOWED_VIDEO_TYPES:
        return error_response('Неподдерживаемый формат видео', 400, headers)
    
    # Декодирование base64
    try:
        if ',' in file_data:
            file_data = file_data.split(',')[1]
        file_bytes = base64.b64decode(file_data)
    except Exception:
        return error_response('Ошибка декодирования файла', 400, headers)
    
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE:
        return error_response(f'Файл слишком большой (макс {MAX_FILE_SIZE // 1024 // 1024}MB)', 400, headers)
    
    # Генерация уникального имени
    file_hash = hashlib.sha256(file_bytes).hexdigest()[:16]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
    unique_filename = f"{timestamp}_{file_hash}.{extension}"
    
    # В реальном приложении здесь была бы загрузка в S3/CDN
    # Для демо используем data URL
    file_url = f"data:{file_type};base64,{base64.b64encode(file_bytes).decode('utf-8')}"
    
    # Сохранение в БД
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        INSERT INTO uploaded_files (filename, original_name, file_url, file_type, file_size, uploaded_by, entity_type, entity_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, filename, file_url, file_type, file_size, created_at
    ''', (unique_filename, file_name, file_url, file_type, file_size, user['id'], entity_type, entity_id))
    
    file_record = dict(cur.fetchone())
    conn.commit()
    
    return success_response({
        'file': file_record,
        'message': 'Файл успешно загружен'
    }, headers)

def handle_get_files(conn: Any, event: Dict, headers: Dict) -> Dict:
    params = event.get('queryStringParameters') or {}
    entity_type = params.get('entity_type')
    entity_id = params.get('entity_id')
    
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if entity_type and entity_id:
        cur.execute('''
            SELECT id, filename, original_name, file_url, file_type, file_size, created_at
            FROM uploaded_files
            WHERE entity_type = %s AND entity_id = %s
            ORDER BY created_at DESC
        ''', (entity_type, entity_id))
    else:
        cur.execute('''
            SELECT id, filename, original_name, file_url, file_type, file_size, created_at
            FROM uploaded_files
            ORDER BY created_at DESC
            LIMIT 100
        ''')
    
    files = [dict(row) for row in cur.fetchall()]
    
    return success_response({'files': files}, headers)

def handle_delete(conn: Any, event: Dict, headers: Dict) -> Dict:
    auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
    
    if not auth_token:
        return error_response('Требуется авторизация', 401, headers)
    
    user = verify_user(conn, auth_token)
    if not user or not user.get('is_admin'):
        return error_response('Недостаточно прав', 403, headers)
    
    params = event.get('queryStringParameters') or {}
    file_id = params.get('id')
    
    if not file_id:
        return error_response('ID файла не указан', 400, headers)
    
    cur = conn.cursor()
    cur.execute('UPDATE uploaded_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s', (file_id,))
    conn.commit()
    
    return success_response({'message': 'Файл удален'}, headers)

def verify_user(conn: Any, token: str) -> Dict:
    import jwt
    
    try:
        secret = os.environ.get('JWT_SECRET', 'default-secret-key')
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, email, username, is_admin FROM users WHERE id = %s AND is_active = TRUE', (payload['user_id'],))
        user = cur.fetchone()
        
        return dict(user) if user else None
    except Exception:
        return None

def success_response(data: Dict, headers: Dict) -> Dict:
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(data, ensure_ascii=False)
    }

def error_response(message: str, status: int, headers: Dict) -> Dict:
    return {
        'statusCode': status,
        'headers': headers,
        'body': json.dumps({'error': message}, ensure_ascii=False)
    }
