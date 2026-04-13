"""
xvChat Profile API — обновление профиля, загрузка аватара в S3, смена пароля, статус онлайн.
"""
import os
import json
import hashlib
import secrets
import base64
from io import BytesIO

import psycopg2
import jwt
import bcrypt
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-change-me")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
    "Access-Control-Max-Age": "86400",
}


def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = False
    return conn


def json_ok(data, status=200):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(data, default=str),
    }


def json_err(msg, status=400):
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"error": msg}),
    }


def auth_user(event):
    headers = event.get("headers") or {}
    auth = headers.get("x-authorization") or headers.get("authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None, None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"], token
    except Exception:
        return None, None


def verify_session(conn, token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT is_valid FROM {SCHEMA}.xvchat_sessions WHERE token_hash=%s AND expires_at > NOW()",
            (token_hash,),
        )
        row = cur.fetchone()
    return row and row[0]


def upload_avatar_s3(data: bytes, user_id: str, content_type: str = "image/jpeg") -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )
    key = f"avatars/{user_id}/{secrets.token_hex(8)}.jpg"
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{AWS_ACCESS_KEY_ID}/bucket/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return json_err("Невалидный JSON")

    user_id, token = auth_user(event)
    if not user_id:
        return json_err("Не авторизован", 401)

    conn = get_db()
    try:
        if not verify_session(conn, token):
            return json_err("Сессия истекла", 401)

        # GET / — получить профиль
        if method == "GET":
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, custom_id, name, email, phone, avatar, bio, status, last_seen, created_at
                        FROM {SCHEMA}.xvchat_users WHERE id=%s""",
                    (user_id,),
                )
                row = cur.fetchone()
            if not row:
                return json_err("Пользователь не найден", 404)
            return json_ok({
                "user": {
                    "id": row[0], "custom_id": row[1], "name": row[2],
                    "email": row[3], "phone": row[4], "avatar": row[5],
                    "bio": row[6], "status": row[7],
                    "last_seen": str(row[8]) if row[8] else None,
                    "created_at": str(row[9]) if row[9] else None,
                }
            })

        # PUT / — обновить профиль
        if method == "PUT" and not path.endswith("/avatar") and not path.endswith("/password") and not path.endswith("/status"):
            allowed = ["name", "bio", "phone", "email"]
            updates = {k: v for k, v in body.items() if k in allowed and v is not None}
            if not updates:
                return json_err("Нечего обновлять")

            if "name" in updates:
                name = updates["name"].strip()
                if len(name) < 2:
                    return json_err("Имя слишком короткое")
                if len(name) > 50:
                    return json_err("Имя слишком длинное")
                updates["name"] = name

            if "bio" in updates and len(updates["bio"]) > 300:
                return json_err("Биография слишком длинная (макс. 300 символов)")

            set_clause = ", ".join([f"{k}=%s" for k in updates.keys()])
            values = list(updates.values()) + [user_id]
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.xvchat_users SET {set_clause} WHERE id=%s",
                    values,
                )
                cur.execute(
                    f"SELECT id, custom_id, name, email, phone, avatar, bio, status FROM {SCHEMA}.xvchat_users WHERE id=%s",
                    (user_id,),
                )
                row = cur.fetchone()
            conn.commit()
            return json_ok({
                "user": {
                    "id": row[0], "custom_id": row[1], "name": row[2],
                    "email": row[3], "phone": row[4], "avatar": row[5],
                    "bio": row[6], "status": row[7],
                }
            })

        # POST /avatar — загрузка аватара (base64)
        if method == "POST" and path.endswith("/avatar"):
            image_b64 = body.get("image")
            if not image_b64:
                return json_err("Укажите image в base64")

            try:
                if "," in image_b64:
                    image_b64 = image_b64.split(",")[1]
                image_data = base64.b64decode(image_b64)
            except Exception:
                return json_err("Невалидный base64 для изображения")

            if len(image_data) > 5 * 1024 * 1024:
                return json_err("Файл слишком большой (макс. 5 МБ)")

            avatar_url = upload_avatar_s3(image_data, user_id)
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.xvchat_users SET avatar=%s WHERE id=%s",
                    (avatar_url, user_id),
                )
            conn.commit()
            return json_ok({"avatar_url": avatar_url})

        # PUT /password — смена пароля
        if method == "PUT" and path.endswith("/password"):
            old_pass = body.get("old_password", "")
            new_pass = body.get("new_password", "")
            if len(new_pass) < 8:
                return json_err("Новый пароль должен быть минимум 8 символов")

            with conn.cursor() as cur:
                cur.execute(f"SELECT password_hash FROM {SCHEMA}.xvchat_users WHERE id=%s", (user_id,))
                row = cur.fetchone()

            if not row or not bcrypt.checkpw(old_pass.encode(), row[0].encode()):
                return json_err("Неверный текущий пароль")

            new_hash = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt(12)).decode()
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.xvchat_users SET password_hash=%s WHERE id=%s", (new_hash, user_id))
                # Инвалидируем все сессии кроме текущей
                token_hash = hashlib.sha256(token.encode()).hexdigest()
                cur.execute(
                    f"UPDATE {SCHEMA}.xvchat_sessions SET is_valid=FALSE WHERE user_id=%s AND token_hash!=%s",
                    (user_id, token_hash),
                )
            conn.commit()
            return json_ok({"ok": True, "message": "Пароль успешно изменён"})

        # PUT /status — обновить статус
        if method == "PUT" and path.endswith("/status"):
            status = body.get("status", "online")
            allowed_statuses = ["online", "offline", "away", "busy"]
            if status not in allowed_statuses:
                return json_err(f"Статус должен быть одним из: {', '.join(allowed_statuses)}")
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE {SCHEMA}.xvchat_users SET status=%s, last_seen=NOW() WHERE id=%s",
                    (status, user_id),
                )
            conn.commit()
            return json_ok({"ok": True, "status": status})

        return json_err("Маршрут не найден", 404)

    except Exception as e:
        conn.rollback()
        return json_err(f"Ошибка сервера: {e}", 500)
    finally:
        conn.close()
