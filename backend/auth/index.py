'''
Business: Защищенная авторизация через Email, Яндекс, Telegram, VK с полной системой безопасности
Args: event - запрос с методом, телом и параметрами; context - контекст выполнения
Returns: HTTP ответ с токеном или данными пользователя
'''

import json
import os
import jwt
import hashlib
import hmac
import secrets
import requests
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30
SESSION_DURATION_DAYS = 30

def create_jwt_token(user_id: str, email: str, is_admin: bool) -> str:
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def create_session_token(conn, user: Dict, event: Dict) -> str:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.now() + timedelta(days=SESSION_DURATION_DAYS)
    ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
    user_agent = event.get('headers', {}).get('User-Agent', 'unknown')
    
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
        VALUES (%s, %s, %s, %s, %s)
    ''', (user['id'], token_hash, ip_address, user_agent, expires_at))
    conn.commit()
    
    return token

def log_security_event(conn, user_id: Optional[str], event_type: str, ip: str, severity: str):
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO security_logs (user_id, event_type, ip_address, severity)
        VALUES (%s, %s, %s, %s)
    ''', (user_id, event_type, ip, severity))
    conn.commit()

def log_login_attempt(conn, email: str, ip: str, user_agent: str, success: bool, reason: str = None):
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
        VALUES (%s, %s, %s, %s, %s)
    ''', (email, ip, user_agent, success, reason))
    conn.commit()

def is_ip_blocked(cur, ip_address: str) -> bool:
    cur.execute('''
        SELECT COUNT(*) as attempts FROM login_attempts
        WHERE ip_address = %s AND success = FALSE 
        AND attempted_at > NOW() - INTERVAL '15 minutes'
    ''', (ip_address,))
    result = cur.fetchone()
    return result['attempts'] >= 10

def verify_telegram_data(data: Dict) -> bool:
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return True
    
    check_hash = data.pop('hash', '')
    data_check_arr = [f"{k}={v}" for k, v in sorted(data.items())]
    data_check_string = '\n'.join(data_check_arr)
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    return calculated_hash == check_hash

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_user = os.environ.get('SMTP_USER', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        
        if not smtp_user or not smtp_password:
            print('SMTP credentials not configured')
            return False
        
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = subject
        
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f'Email send error: {e}')
        return False

def create_reset_token(conn, user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=1)
    
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (%s, %s, %s)
    ''', (user_id, token, expires_at))
    conn.commit()
    
    return token

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
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id, X-Session-Id',
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
    
    # OAuth callbacks и Email авторизация
    if method == 'POST':
        conn = get_db_connection()
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', '')
        provider = body_data.get('provider')
        ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        user_agent = event.get('headers', {}).get('User-Agent', 'unknown')
        
        # Регистрация через Email
        if action == 'register':
            email = body_data.get('email', '').lower().strip()
            password = body_data.get('password', '')
            username = body_data.get('username', '')
            
            if not email or not password or not username:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Email, пароль и имя обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(password) < 8:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пароль должен быть минимум 8 символов'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                log_security_event(conn, None, 'registration_duplicate', ip_address, 'medium')
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Email уже зарегистрирован'}),
                    'isBase64Encoded': False
                }
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            user_id = f"email-{secrets.token_urlsafe(16)}"
            
            cur.execute('''
                INSERT INTO users (id, email, password_hash, username, provider, provider_id, email_verified)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, email, username, is_admin, avatar_url
            ''', (user_id, email, password_hash, username, 'email', user_id, False))
            
            user = dict(cur.fetchone())
            conn.commit()
            
            token = create_session_token(conn, user, event)
            jwt_token = create_jwt_token(user['id'], user['email'], user.get('is_admin', False))
            log_security_event(conn, user_id, 'registration_success', ip_address, 'low')
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'token': jwt_token, 'session_token': token, 'user': user}),
                'isBase64Encoded': False
            }
        
        # Запрос восстановления пароля
        elif action == 'forgot_password':
            email = body_data.get('email', '').lower().strip()
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT id, username FROM users 
                WHERE email = %s AND provider = %s AND is_active = TRUE
            ''', (email, 'email'))
            
            user = cur.fetchone()
            
            if user:
                reset_token = create_reset_token(conn, user['id'])
                site_url = os.environ.get('SITE_URL', window_location_origin)
                reset_link = f"{site_url}/reset-password?token={reset_token}"
                
                html_content = f'''
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Восстановление пароля</h2>
                    <p>Здравствуйте, {user['username']}!</p>
                    <p>Вы запросили восстановление пароля для вашего аккаунта на DokiDokiHub.</p>
                    <p>Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
                    <a href="{reset_link}" style="display: inline-block; padding: 12px 24px; background-color: #0077FF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Восстановить пароль</a>
                    <p>Или скопируйте эту ссылку в браузер:</p>
                    <p style="color: #666; font-size: 14px;">{reset_link}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">Ссылка действительна 1 час. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
                </body>
                </html>
                '''
                
                send_email(email, 'Восстановление пароля - DokiDokiHub', html_content)
                log_security_event(conn, user['id'], 'password_reset_requested', ip_address, 'low')
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'message': 'Если email существует, на него отправлена ссылка для восстановления'}),
                'isBase64Encoded': False
            }
        
        # Сброс пароля по токену
        elif action == 'reset_password':
            token = body_data.get('token', '')
            new_password = body_data.get('password', '')
            
            if not token or not new_password:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Токен и новый пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(new_password) < 8:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пароль должен быть минимум 8 символов'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT user_id FROM password_reset_tokens
                WHERE token = %s AND expires_at > CURRENT_TIMESTAMP AND used = FALSE
            ''', (token,))
            
            reset_data = cur.fetchone()
            
            if not reset_data:
                log_security_event(conn, None, 'invalid_reset_token', ip_address, 'medium')
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Недействительный или истекший токен'}),
                    'isBase64Encoded': False
                }
            
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cur.execute('''
                UPDATE users SET password_hash = %s, failed_login_attempts = 0, locked_until = NULL
                WHERE id = %s
            ''', (password_hash, reset_data['user_id']))
            
            cur.execute('''
                UPDATE password_reset_tokens SET used = TRUE WHERE token = %s
            ''', (token,))
            
            conn.commit()
            log_security_event(conn, reset_data['user_id'], 'password_reset_completed', ip_address, 'low')
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'message': 'Пароль успешно изменен'}),
                'isBase64Encoded': False
            }
        
        # Вход через Email
        elif action == 'login':
            email = body_data.get('email', '').lower().strip()
            password = body_data.get('password', '')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Email и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            if is_ip_blocked(cur, ip_address):
                log_security_event(conn, None, 'blocked_ip_attempt', ip_address, 'high')
                return {
                    'statusCode': 429,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Слишком много попыток входа. Попробуйте позже.'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT id, email, password_hash, username, is_admin, is_active, 
                       failed_login_attempts, locked_until, avatar_url
                FROM users WHERE email = %s AND provider = %s
            ''', (email, 'email'))
            
            user = cur.fetchone()
            
            if not user:
                log_login_attempt(conn, email, ip_address, user_agent, False, 'user_not_found')
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Неверный email или пароль'}),
                    'isBase64Encoded': False
                }
            
            if user['locked_until'] and user['locked_until'] > datetime.now():
                log_security_event(conn, user['id'], 'locked_account_attempt', ip_address, 'high')
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': cors_headers,
                    'body': json.dumps({'error': f"Аккаунт заблокирован до {user['locked_until']}"}),
                    'isBase64Encoded': False
                }
            
            if not user['is_active']:
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Аккаунт деактивирован'}),
                    'isBase64Encoded': False
                }
            
            if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                log_login_attempt(conn, email, ip_address, user_agent, False, 'wrong_password')
                
                new_attempts = user['failed_login_attempts'] + 1
                locked_until = None
                
                if new_attempts >= MAX_LOGIN_ATTEMPTS:
                    locked_until = datetime.now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                    cur.execute('''
                        UPDATE users SET failed_login_attempts = %s, locked_until = %s
                        WHERE id = %s
                    ''', (new_attempts, locked_until, user['id']))
                    log_security_event(conn, user['id'], 'account_locked', ip_address, 'critical')
                else:
                    cur.execute('''
                        UPDATE users SET failed_login_attempts = %s WHERE id = %s
                    ''', (new_attempts, user['id']))
                
                conn.commit()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Неверный email или пароль'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (user['id'],))
            conn.commit()
            
            log_login_attempt(conn, email, ip_address, user_agent, True)
            log_security_event(conn, user['id'], 'login_success', ip_address, 'low')
            
            user_dict = {k: v for k, v in dict(user).items() if k != 'password_hash' and k != 'failed_login_attempts' and k != 'locked_until'}
            token = create_session_token(conn, user_dict, event)
            jwt_token = create_jwt_token(user['id'], user['email'], user.get('is_admin', False))
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'token': jwt_token, 'session_token': token, 'user': user_dict}),
                'isBase64Encoded': False
            }
        
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
            telegram_data = body_data.get('telegram_data', {})
            
            if not verify_telegram_data(telegram_data.copy()):
                log_security_event(conn, None, 'telegram_auth_fake', ip_address, 'critical')
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Неверные данные авторизации Telegram'}),
                    'isBase64Encoded': False
                }
            
            user = get_or_create_user(
                'telegram',
                str(telegram_data.get('id')),
                telegram_data.get('username', telegram_data.get('first_name', 'User')),
                None,
                telegram_data.get('photo_url')
            )
            
            token = create_jwt_token(user['id'], user.get('email', ''), user.get('is_admin', False))
            session_token = create_session_token(conn, user, event)
            log_security_event(conn, user['id'], 'telegram_login', ip_address, 'low')
            
            conn.close()
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'token': token, 'session_token': session_token, 'user': user}),
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