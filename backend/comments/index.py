import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для коментарів до аніме (отримання, додавання)
    Args: event - dict з httpMethod, body, queryStringParameters
          context - об'єкт з атрибутами request_id
    Returns: HTTP відповідь dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-User-Name',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            anime_id = query_params.get('anime_id')
            
            if not anime_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'anime_id is required'})
                }
            
            cur.execute(
                "SELECT id, user_id, user_name, comment_text, created_at FROM comments WHERE anime_id = %s ORDER BY created_at DESC LIMIT 100",
                (anime_id,)
            )
            
            rows = cur.fetchall()
            comments = []
            for row in rows:
                comments.append({
                    'id': row[0],
                    'user_id': row[1],
                    'user_name': row[2],
                    'text': row[3],
                    'created_at': row[4].isoformat() if row[4] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'comments': comments})
            }
        
        elif method == 'POST':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            user_name = headers.get('X-User-Name') or headers.get('x-user-name')
            
            if not user_id or not user_name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'X-User-Id and X-User-Name headers are required'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            anime_id = body_data.get('anime_id')
            comment_text = body_data.get('text', '').strip()
            
            if not anime_id or not comment_text:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'anime_id and text are required'})
                }
            
            if len(comment_text) > 1000:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Comment is too long (max 1000 characters)'})
                }
            
            cur.execute(
                "INSERT INTO comments (user_id, user_name, anime_id, comment_text) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (user_id, user_name, anime_id, comment_text)
            )
            result = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': result[0],
                    'message': 'Comment added',
                    'created_at': result[1].isoformat()
                })
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
