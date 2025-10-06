import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управління аніме (отримання списку, додавання, оновлення)
    Args: event - dict з httpMethod, body, queryStringParameters
          context - об'єкт з атрибутами request_id, function_name
    Returns: HTTP відповідь dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
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
            search = query_params.get('search', '')
            
            if search:
                cur.execute(
                    "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status FROM anime WHERE title ILIKE %s ORDER BY id DESC",
                    (f'%{search}%',)
                )
            else:
                cur.execute(
                    "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status FROM anime ORDER BY id DESC"
                )
            
            rows = cur.fetchall()
            anime_list = []
            for row in rows:
                anime_list.append({
                    'id': str(row[0]),
                    'title': row[1],
                    'image': row[2],
                    'episodes': row[3],
                    'rating': float(row[4]) if row[4] else 0.0,
                    'description': row[5],
                    'genres': row[6] if row[6] else [],
                    'releaseYear': row[7],
                    'status': row[8]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'anime': anime_list})
            }
        
        elif method == 'POST':
            headers = event.get('headers', {})
            admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key')
            
            if admin_key != 'dokidoki-admin-2024':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            title = body_data.get('title')
            image_url = body_data.get('image_url')
            episodes = body_data.get('episodes', 1)
            rating = body_data.get('rating', 0.0)
            description = body_data.get('description', '')
            genres = body_data.get('genres', [])
            release_year = body_data.get('release_year')
            status = body_data.get('status', 'ongoing')
            
            if not title or not image_url:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Title and image_url are required'})
                }
            
            cur.execute(
                "INSERT INTO anime (title, image_url, episodes, rating, description, genres, release_year, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (title, image_url, episodes, rating, description, genres, release_year, status)
            )
            anime_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': anime_id, 'message': 'Anime added successfully'})
            }
        
        elif method == 'PUT':
            headers = event.get('headers', {})
            admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key')
            
            if admin_key != 'dokidoki-admin-2024':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
                }
            
            body_data = json.loads(event.get('body', '{}'))
            anime_id = body_data.get('id')
            
            if not anime_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Anime ID is required'})
                }
            
            updates = []
            params = []
            
            if 'title' in body_data:
                updates.append('title = %s')
                params.append(body_data['title'])
            if 'image_url' in body_data:
                updates.append('image_url = %s')
                params.append(body_data['image_url'])
            if 'episodes' in body_data:
                updates.append('episodes = %s')
                params.append(body_data['episodes'])
            if 'rating' in body_data:
                updates.append('rating = %s')
                params.append(body_data['rating'])
            if 'description' in body_data:
                updates.append('description = %s')
                params.append(body_data['description'])
            if 'genres' in body_data:
                updates.append('genres = %s')
                params.append(body_data['genres'])
            if 'release_year' in body_data:
                updates.append('release_year = %s')
                params.append(body_data['release_year'])
            if 'status' in body_data:
                updates.append('status = %s')
                params.append(body_data['status'])
            
            if not updates:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'})
                }
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(anime_id)
            
            query = f"UPDATE anime SET {', '.join(updates)} WHERE id = %s"
            cur.execute(query, params)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Anime updated successfully'})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
