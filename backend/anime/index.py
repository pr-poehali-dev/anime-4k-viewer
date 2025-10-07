'''
Business: Защищенная система управления аниме с поддержкой сериалов и фильмов, разных качеств видео
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP ответ dict
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
from typing import Dict, Any
import jwt

def verify_admin_token(event: Dict) -> Dict[str, Any]:
    token = event.get('headers', {}).get('x-auth-token', '')
    if not token:
        return {'error': 'No token provided'}
    
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        if not payload.get('is_admin'):
            return {'error': 'Admin access required'}
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action', 'get_list')
            anime_type = query_params.get('type', 'all')
            search = query_params.get('search', '')
            
            if action == 'get_all':
                admin_data = verify_admin_token(event)
                if 'error' in admin_data:
                    return {
                        'statusCode': 403,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                if anime_type == 'movies':
                    cur.execute('SELECT * FROM anime WHERE is_movie = TRUE ORDER BY release_year DESC, id DESC')
                elif anime_type == 'series':
                    cur.execute('SELECT * FROM anime WHERE is_movie = FALSE ORDER BY release_year DESC, id DESC')
                else:
                    cur.execute('SELECT * FROM anime ORDER BY release_year DESC, id DESC')
                
                animes = [dict(row) for row in cur.fetchall()]
                
                for anime in animes:
                    if anime.get('created_at'):
                        anime['created_at'] = anime['created_at'].isoformat()
                    if anime.get('updated_at'):
                        anime['updated_at'] = anime['updated_at'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'animes': animes}),
                    'isBase64Encoded': False
                }
            
            else:
                if anime_type == 'movies':
                    if search:
                        cur.execute(
                            "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status, is_movie, duration_minutes FROM anime WHERE is_movie = TRUE AND title ILIKE %s ORDER BY release_year DESC",
                            (f'%{search}%',)
                        )
                    else:
                        cur.execute(
                            "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status, is_movie, duration_minutes FROM anime WHERE is_movie = TRUE ORDER BY release_year DESC"
                        )
                elif anime_type == 'series':
                    if search:
                        cur.execute(
                            "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status, is_movie FROM anime WHERE is_movie = FALSE AND title ILIKE %s ORDER BY release_year DESC",
                            (f'%{search}%',)
                        )
                    else:
                        cur.execute(
                            "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status, is_movie FROM anime WHERE is_movie = FALSE ORDER BY release_year DESC"
                        )
                else:
                    if search:
                        cur.execute(
                            "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status, is_movie, duration_minutes FROM anime WHERE title ILIKE %s ORDER BY release_year DESC",
                            (f'%{search}%',)
                        )
                    else:
                        cur.execute(
                            "SELECT id, title, image_url, episodes, rating, description, genres, release_year, status, is_movie, duration_minutes FROM anime ORDER BY release_year DESC"
                        )
                
                rows = cur.fetchall()
                anime_list = []
                for row in rows:
                    anime_dict = dict(row)
                    anime_list.append({
                        'id': str(anime_dict['id']),
                        'title': anime_dict['title'],
                        'image': anime_dict['image_url'],
                        'episodes': anime_dict['episodes'],
                        'rating': float(anime_dict['rating']) if anime_dict['rating'] else 0.0,
                        'description': anime_dict['description'],
                        'genres': anime_dict['genres'] if anime_dict['genres'] else [],
                        'releaseYear': anime_dict['release_year'],
                        'status': anime_dict['status'],
                        'isMovie': anime_dict.get('is_movie', False),
                        'duration': anime_dict.get('duration_minutes')
                    })
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'anime': anime_list}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            admin_data = verify_admin_token(event)
            if 'error' in admin_data:
                return {
                    'statusCode': 403,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Admin access required'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'add_anime':
                title = body_data.get('title', '').strip()
                image_url = body_data.get('image_url', '').strip()
                episodes = int(body_data.get('episodes', 12))
                rating = float(body_data.get('rating', 8.0))
                description = body_data.get('description', '').strip()
                genres = body_data.get('genres', [])
                release_year = int(body_data.get('release_year', datetime.now().year))
                status = body_data.get('status', 'Онгоинг')
                video_4k = body_data.get('video_quality_4k', '')
                video_1080p = body_data.get('video_quality_1080p', '')
                video_720p = body_data.get('video_quality_720p', '')
                video_480p = body_data.get('video_quality_480p', '')
                anime_type = body_data.get('anime_type', 'series')
                duration = body_data.get('duration_minutes', 24)
                is_movie = body_data.get('is_movie', False)
                
                if not title:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'Название обязательно'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('''
                    INSERT INTO anime (
                        title, image_url, episodes, rating, description, genres, 
                        release_year, status, video_quality_4k, video_quality_1080p,
                        video_quality_720p, video_quality_480p, anime_type, 
                        duration_minutes, is_movie, created_at, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    title, image_url, episodes, rating, description, genres,
                    release_year, status, video_4k, video_1080p, video_720p,
                    video_480p, anime_type, duration, is_movie, 
                    datetime.now(), datetime.now()
                ))
                
                new_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'success': True, 'id': new_id, 'message': 'Аниме добавлено'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_anime':
                anime_id = body_data.get('anime_id')
                if not anime_id:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'anime_id обязателен'}),
                        'isBase64Encoded': False
                    }
                
                update_fields = []
                update_values = []
                
                fields_map = {
                    'title': 'title',
                    'image_url': 'image_url',
                    'episodes': 'episodes',
                    'rating': 'rating',
                    'description': 'description',
                    'genres': 'genres',
                    'release_year': 'release_year',
                    'status': 'status',
                    'video_quality_4k': 'video_quality_4k',
                    'video_quality_1080p': 'video_quality_1080p',
                    'video_quality_720p': 'video_quality_720p',
                    'video_quality_480p': 'video_quality_480p',
                    'anime_type': 'anime_type',
                    'duration_minutes': 'duration_minutes',
                    'is_movie': 'is_movie'
                }
                
                for key, db_field in fields_map.items():
                    if key in body_data:
                        update_fields.append(f"{db_field} = %s")
                        update_values.append(body_data[key])
                
                if not update_fields:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'Нет полей для обновления'}),
                        'isBase64Encoded': False
                    }
                
                update_fields.append("updated_at = %s")
                update_values.append(datetime.now())
                update_values.append(anime_id)
                
                query = f"UPDATE anime SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, update_values)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'success': True, 'message': 'Аниме обновлено'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'delete_anime':
                anime_id = body_data.get('anime_id')
                if not anime_id:
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'anime_id обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute('UPDATE anime SET status = %s, updated_at = %s WHERE id = %s', 
                           ('Удалено', datetime.now(), anime_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'success': True, 'message': 'Аниме удалено'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
