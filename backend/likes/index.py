"""
Управление лайками треков пользователя. Сохраняет и загружает избранное.
"""
import json
import os
import hashlib
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-User-Id',
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def make_session_token(google_id: str) -> str:
    secret = os.environ.get('GOOGLE_CLIENT_ID', 'fallback')
    return hashlib.sha256(f"{google_id}:{secret}:nocturn".encode()).hexdigest()


def verify_session(user_id: str, session: str, conn) -> bool:
    cur = conn.cursor()
    cur.execute("SELECT google_id FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    if not row:
        return False
    return make_session_token(row[0]) == session


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    headers = event.get('headers') or {}
    session = headers.get('X-Session-Id', '')
    user_id = headers.get('X-User-Id', '')

    if not session or not user_id:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Unauthorized'})}

    conn = get_db()

    if not verify_session(user_id, session, conn):
        conn.close()
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Invalid session'})}

    # GET — загрузить лайки
    if method == 'GET':
        cur = conn.cursor()
        cur.execute("""
            SELECT track_id, title, artist, cover, preview, duration, added_at
            FROM liked_tracks WHERE user_id = %s ORDER BY added_at DESC
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        tracks = [
            {'id': r[0], 'title': r[1], 'artist': r[2], 'cover': r[3],
             'preview': r[4], 'duration': r[5], 'added_at': str(r[6])}
            for r in rows
        ]
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'tracks': tracks})
        }

    # POST — добавить лайк
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        track = body.get('track', {})
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO liked_tracks (user_id, track_id, title, artist, cover, preview, duration)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, track_id) DO NOTHING
        """, (user_id, track.get('id'), track.get('title'), track.get('artist'),
              track.get('cover'), track.get('preview'), track.get('duration')))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    # DELETE — убрать лайк
    if method == 'DELETE':
        body = json.loads(event.get('body') or '{}')
        track_id = body.get('track_id')
        cur = conn.cursor()
        cur.execute("DELETE FROM liked_tracks WHERE user_id = %s AND track_id = %s", (user_id, track_id))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
