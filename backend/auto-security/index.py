'''
Business: Система автоматической защиты от взлома с автосменой паролей
Args: event - запрос с данными угрозы; context - контекст выполнения  
Returns: HTTP ответ с действиями безопасности
'''

import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt

DATABASE_URL = os.environ.get('DATABASE_URL')

# Уровни угроз
THREAT_LEVELS = {
    'low': 1,
    'medium': 5,
    'high': 10,
    'critical': 20
}

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
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
    
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        
        if method == 'POST':
            return handle_threat_detection(conn, event, cors_headers)
        elif method == 'GET':
            return handle_get_security_status(conn, event, cors_headers)
            
        return error_response('Метод не поддерживается', 405, cors_headers)
        
    except Exception as e:
        return error_response(f'Ошибка: {str(e)}', 500, cors_headers)
    finally:
        if 'conn' in locals():
            conn.close()

def handle_threat_detection(conn: Any, event: Dict, headers: Dict) -> Dict:
    body = json.loads(event.get('body', '{}'))
    threat_type = body.get('threat_type')
    threat_level = body.get('threat_level', 'low')
    source_ip = get_ip(event)
    details = body.get('details', {})
    
    # Логирование угрозы
    log_threat(conn, threat_type, threat_level, source_ip, details)
    
    # Автоматические действия по защите
    actions_taken = []
    
    # 1. Брутфорс - автосмена пароля
    if threat_type == 'brute_force_detected':
        affected_users = detect_brute_force_targets(conn, source_ip)
        for user in affected_users:
            new_password = auto_change_password(conn, user['id'])
            send_password_change_notification(user, new_password)
            actions_taken.append(f"Пароль изменен для пользователя {user['username']}")
    
    # 2. SQL инъекция - блокировка IP
    elif threat_type == 'sql_injection_attempt':
        block_ip(conn, source_ip, hours=24)
        actions_taken.append(f"IP {source_ip} заблокирован на 24 часа")
    
    # 3. DDoS - rate limiting
    elif threat_type == 'ddos_detected':
        enable_rate_limit(conn, source_ip)
        actions_taken.append(f"Включен rate limit для IP {source_ip}")
    
    # 4. Подозрительный паттерн входа - требование 2FA
    elif threat_type == 'suspicious_login_pattern':
        user_id = details.get('user_id')
        if user_id:
            enable_2fa_requirement(conn, user_id)
            actions_taken.append(f"Включена обязательная 2FA для пользователя")
    
    # 5. Утечка пароля - принудительный сброс
    elif threat_type == 'password_leak_detected':
        user_id = details.get('user_id')
        if user_id:
            force_password_reset(conn, user_id)
            actions_taken.append(f"Принудительный сброс пароля")
    
    # 6. Множественные неудачные попытки - блокировка аккаунта
    elif threat_type == 'multiple_failed_attempts':
        user_id = details.get('user_id')
        if user_id:
            lock_account(conn, user_id, minutes=30)
            actions_taken.append(f"Аккаунт заблокирован на 30 минут")
    
    # 7. Подозрительная активность - очистка сессий
    elif threat_type == 'suspicious_activity':
        user_id = details.get('user_id')
        if user_id:
            clear_user_sessions(conn, user_id)
            actions_taken.append(f"Все сессии пользователя завершены")
    
    # Логирование действий
    log_security_action(conn, threat_type, actions_taken, source_ip)
    
    return success_response({
        'threat_detected': threat_type,
        'threat_level': threat_level,
        'actions_taken': actions_taken,
        'timestamp': datetime.now().isoformat()
    }, headers)

def handle_get_security_status(conn: Any, event: Dict, headers: Dict) -> Dict:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Последние угрозы
    cur.execute('''
        SELECT threat_type, threat_level, source_ip, created_at
        FROM auto_security_logs
        ORDER BY created_at DESC
        LIMIT 20
    ''')
    recent_threats = [dict(row) for row in cur.fetchall()]
    
    # Статистика за последние 24 часа
    cur.execute('''
        SELECT threat_level, COUNT(*) as count
        FROM auto_security_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY threat_level
    ''')
    threat_stats = {row['threat_level']: row['count'] for row in cur.fetchall()}
    
    # Заблокированные IP
    cur.execute('''
        SELECT DISTINCT source_ip
        FROM auto_security_logs
        WHERE action_taken LIKE '%заблокирован%'
        AND created_at > NOW() - INTERVAL '24 hours'
    ''')
    blocked_ips = [row['source_ip'] for row in cur.fetchall()]
    
    return success_response({
        'recent_threats': recent_threats,
        'threat_stats': threat_stats,
        'blocked_ips': blocked_ips,
        'security_level': calculate_security_level(threat_stats)
    }, headers)

def detect_brute_force_targets(conn: Any, ip: str) -> List[Dict]:
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute('''
        SELECT DISTINCT u.id, u.username, u.email
        FROM login_attempts la
        JOIN users u ON la.email = u.email
        WHERE la.ip_address = %s
        AND la.success = FALSE
        AND la.attempted_at > NOW() - INTERVAL '10 minutes'
        GROUP BY u.id, u.username, u.email
        HAVING COUNT(*) >= 3
    ''', (ip,))
    return [dict(row) for row in cur.fetchall()]

def auto_change_password(conn: Any, user_id: str) -> str:
    new_password = secrets.token_urlsafe(16)
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cur = conn.cursor()
    cur.execute('''
        UPDATE users 
        SET password_hash = %s, failed_login_attempts = 0, locked_until = NULL
        WHERE id = %s
    ''', (password_hash, user_id))
    conn.commit()
    
    return new_password

def block_ip(conn: Any, ip: str, hours: int = 24):
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO login_attempts (ip_address, success, failure_reason)
        VALUES (%s, FALSE, 'IP_BLOCKED')
    ''', (ip,))
    conn.commit()

def enable_rate_limit(conn: Any, ip: str):
    # Реализация rate limiting
    pass

def enable_2fa_requirement(conn: Any, user_id: str):
    cur = conn.cursor()
    cur.execute('''
        UPDATE users SET requires_2fa = TRUE WHERE id = %s
    ''', (user_id,))
    conn.commit()

def force_password_reset(conn: Any, user_id: str):
    cur = conn.cursor()
    cur.execute('''
        UPDATE users SET must_reset_password = TRUE WHERE id = %s
    ''', (user_id,))
    conn.commit()

def lock_account(conn: Any, user_id: str, minutes: int = 30):
    locked_until = datetime.now() + timedelta(minutes=minutes)
    cur = conn.cursor()
    cur.execute('''
        UPDATE users SET locked_until = %s WHERE id = %s
    ''', (locked_until, user_id))
    conn.commit()

def clear_user_sessions(conn: Any, user_id: str):
    cur = conn.cursor()
    cur.execute('''
        UPDATE sessions SET expires_at = CURRENT_TIMESTAMP WHERE user_id = %s
    ''', (user_id,))
    conn.commit()

def log_threat(conn: Any, threat_type: str, threat_level: str, ip: str, details: Dict):
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO auto_security_logs (threat_type, threat_level, source_ip, details)
        VALUES (%s, %s, %s, %s)
    ''', (threat_type, threat_level, ip, json.dumps(details)))
    conn.commit()

def log_security_action(conn: Any, threat_type: str, actions: List[str], ip: str):
    cur = conn.cursor()
    action_text = '; '.join(actions)
    cur.execute('''
        UPDATE auto_security_logs 
        SET action_taken = %s
        WHERE threat_type = %s AND source_ip = %s
        ORDER BY created_at DESC
        LIMIT 1
    ''', (action_text, threat_type, ip))
    conn.commit()

def send_password_change_notification(user: Dict, new_password: str):
    # Здесь отправка email с новым паролем
    print(f"Новый пароль для {user['username']}: {new_password}")

def calculate_security_level(stats: Dict) -> str:
    total_score = sum(stats.get(level, 0) * THREAT_LEVELS.get(level, 0) for level in stats)
    
    if total_score == 0:
        return 'Отлично'
    elif total_score < 10:
        return 'Хорошо'
    elif total_score < 50:
        return 'Умеренно'
    else:
        return 'Критично'

def get_ip(event: Dict) -> str:
    return event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')

def success_response(data: Dict, headers: Dict) -> Dict:
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(data, ensure_ascii=False, default=str)
    }

def error_response(message: str, status: int, headers: Dict) -> Dict:
    return {
        'statusCode': status,
        'headers': headers,
        'body': json.dumps({'error': message}, ensure_ascii=False)
    }
