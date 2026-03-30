"""
Google OAuth авторизация. Верифицирует Google токен и возвращает сессию пользователя.
"""
import json
import os
import hashlib
import urllib.request
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def make_session_token(google_id: str) -> str:
    secret = os.environ.get('GOOGLE_CLIENT_ID', 'fallback')
    return hashlib.sha256(f"{google_id}:{secret}:nocturn".encode()).hexdigest()


def verify_google_token(token: str) -> dict | None:
    client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read())
        if data.get('aud') != client_id:
            return None
        return data
    except Exception:
        return None


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # POST ?action=login — Google token → session
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        credential = body.get('credential', '')

        user_info = verify_google_token(credential)
        if not user_info:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Invalid token'})}

        google_id = user_info['sub']
        email = user_info.get('email', '')
        name = user_info.get('name', email.split('@')[0])
        avatar = user_info.get('picture', '')

        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users (google_id, email, name, avatar, last_login)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (google_id) DO UPDATE
            SET name = EXCLUDED.name, avatar = EXCLUDED.avatar, last_login = NOW()
            RETURNING id, name, email, avatar, created_at
        """, (google_id, email, name, avatar))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        session_token = make_session_token(google_id)
        user = {'id': row[0], 'name': row[1], 'email': row[2], 'avatar': row[3], 'created_at': str(row[4])}

        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'user': user, 'session': session_token})
        }

    # GET — проверка сессии
    if method == 'GET':
        headers = event.get('headers') or {}
        session = headers.get('X-Session-Id', '')
        user_id = (event.get('queryStringParameters') or {}).get('user_id', '')

        if not session or not user_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'No session'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, google_id, name, email, avatar, created_at FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'User not found'})}

        expected = make_session_token(row[1])
        if session != expected:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Invalid session'})}

        user = {'id': row[0], 'name': row[2], 'email': row[3], 'avatar': row[4], 'created_at': str(row[5])}
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps({'user': user})
        }

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}