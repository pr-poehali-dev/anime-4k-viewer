import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для оцінок аніме (отримання, додавання, оновлення)
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
                "SELECT AVG(rating)::numeric(3,1), COUNT(*) FROM ratings WHERE anime_id = %s",
                (anime_id,)
            )
            row = cur.fetchone()
            avg_rating = float(row[0]) if row[0] else 0.0
            total_ratings = row[1]
            
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            user_rating = None
            
            if user_id:
                cur.execute(
                    "SELECT rating FROM ratings WHERE anime_id = %s AND user_id = %s",
                    (anime_id, user_id)
                )
                user_row = cur.fetchone()
                if user_row:
                    user_rating = user_row[0]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'average_rating': avg_rating,
                    'total_ratings': total_ratings,
                    'user_rating': user_rating
                })
            }
        
        elif method == 'POST':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'X-User-Id header is required'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            anime_id = body_data.get('anime_id')
            rating = body_data.get('rating')
            
            if not anime_id or rating is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'anime_id and rating are required'})
                }
            
            if rating < 1 or rating > 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'rating must be between 1 and 10'})
                }
            
            cur.execute(
                "INSERT INTO ratings (user_id, anime_id, rating) VALUES (%s, %s, %s) ON CONFLICT (user_id, anime_id) DO UPDATE SET rating = %s, created_at = CURRENT_TIMESTAMP",
                (user_id, anime_id, rating, rating)
            )
            conn.commit()
            
            cur.execute(
                "SELECT AVG(rating)::numeric(3,1), COUNT(*) FROM ratings WHERE anime_id = %s",
                (anime_id,)
            )
            row = cur.fetchone()
            avg_rating = float(row[0]) if row[0] else 0.0
            total_ratings = row[1]
            
            cur.execute(
                "UPDATE anime SET rating = %s WHERE id = %s",
                (avg_rating, anime_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': 'Rating saved',
                    'average_rating': avg_rating,
                    'total_ratings': total_ratings
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
