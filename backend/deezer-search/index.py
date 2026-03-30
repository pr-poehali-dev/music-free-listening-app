"""
Поиск треков через Deezer API. Возвращает список треков с превью.
"""
import json
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    params = event.get('queryStringParameters') or {}
    query = params.get('q', '')
    search_type = params.get('type', 'track')  # track, artist, genre
    limit = int(params.get('limit', '20'))

    if not query:
        # Возвращаем топ-чарты если запрос пустой
        url = 'https://api.deezer.com/chart/0/tracks?limit=20'
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
        tracks = [_format_track(t) for t in data.get('data', [])]
        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({'tracks': tracks, 'total': len(tracks), 'type': 'chart'})
        }

    encoded = urllib.parse.quote(query)

    if search_type == 'genre':
        # Поиск по жанру через редактора
        url = f'https://api.deezer.com/search/track?q=genre:"{encoded}"&limit={limit}'
    else:
        url = f'https://api.deezer.com/search/track?q={encoded}&limit={limit}'

    with urllib.request.urlopen(url, timeout=10) as resp:
        data = json.loads(resp.read())

    tracks = [_format_track(t) for t in data.get('data', []) if t.get('preview')]

    return {
        'statusCode': 200,
        'headers': {**cors_headers, 'Content-Type': 'application/json'},
        'body': json.dumps({'tracks': tracks, 'total': len(tracks), 'query': query})
    }


def _format_track(t: dict) -> dict:
    return {
        'id': t.get('id'),
        'title': t.get('title', ''),
        'artist': t.get('artist', {}).get('name', ''),
        'artist_picture': t.get('artist', {}).get('picture_medium', ''),
        'album': t.get('album', {}).get('title', ''),
        'cover': t.get('album', {}).get('cover_medium', ''),
        'cover_xl': t.get('album', {}).get('cover_xl', ''),
        'preview': t.get('preview', ''),
        'duration': t.get('duration', 0),
        'rank': t.get('rank', 0),
    }
