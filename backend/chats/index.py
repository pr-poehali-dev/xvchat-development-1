"""
xvChat Chats API — создание чатов, список чатов, поиск пользователей.
Требует JWT авторизации через заголовок X-Authorization: Bearer <token>
"""
import os
import json
import hashlib
import secrets
from datetime import datetime, timezone

import psycopg2
import jwt

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-change-me")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-User-Id",
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


def gen_id(prefix):
    return f"{prefix}_{secrets.token_hex(8)}"


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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
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

        # GET / — список чатов пользователя
        if method == "GET" and (path.endswith("/chats") or path == "/"):
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT
                            c.id, c.is_group, c.group_name, c.group_avatar, c.updated_at,
                            c.last_message_at,
                            -- Для приватных чатов: данные собеседника
                            (
                                SELECT u2.id FROM {SCHEMA}.xvchat_chat_participants cp2
                                JOIN {SCHEMA}.xvchat_users u2 ON u2.id = cp2.user_id
                                WHERE cp2.chat_id = c.id AND cp2.user_id != %s LIMIT 1
                            ) as other_user_id,
                            (
                                SELECT u2.name FROM {SCHEMA}.xvchat_chat_participants cp2
                                JOIN {SCHEMA}.xvchat_users u2 ON u2.id = cp2.user_id
                                WHERE cp2.chat_id = c.id AND cp2.user_id != %s LIMIT 1
                            ) as other_user_name,
                            (
                                SELECT u2.avatar FROM {SCHEMA}.xvchat_chat_participants cp2
                                JOIN {SCHEMA}.xvchat_users u2 ON u2.id = cp2.user_id
                                WHERE cp2.chat_id = c.id AND cp2.user_id != %s LIMIT 1
                            ) as other_user_avatar,
                            (
                                SELECT u2.status FROM {SCHEMA}.xvchat_chat_participants cp2
                                JOIN {SCHEMA}.xvchat_users u2 ON u2.id = cp2.user_id
                                WHERE cp2.chat_id = c.id AND cp2.user_id != %s LIMIT 1
                            ) as other_user_status,
                            -- Последнее сообщение
                            (
                                SELECT m.content FROM {SCHEMA}.xvchat_messages m
                                WHERE m.chat_id = c.id AND m.hidden = FALSE
                                ORDER BY m.created_at DESC LIMIT 1
                            ) as last_msg,
                            (
                                SELECT m.content_type FROM {SCHEMA}.xvchat_messages m
                                WHERE m.chat_id = c.id AND m.hidden = FALSE
                                ORDER BY m.created_at DESC LIMIT 1
                            ) as last_msg_type,
                            (
                                SELECT m.created_at FROM {SCHEMA}.xvchat_messages m
                                WHERE m.chat_id = c.id AND m.hidden = FALSE
                                ORDER BY m.created_at DESC LIMIT 1
                            ) as last_msg_at,
                            -- Непрочитанные
                            (
                                SELECT COUNT(*) FROM {SCHEMA}.xvchat_messages m
                                WHERE m.chat_id = c.id AND m.sender_id != %s AND m.is_read = FALSE AND m.hidden = FALSE
                            ) as unread_count
                        FROM {SCHEMA}.xvchat_chats c
                        JOIN {SCHEMA}.xvchat_chat_participants cp ON cp.chat_id = c.id
                        WHERE cp.user_id = %s
                        ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC
                        LIMIT 50""",
                    (user_id, user_id, user_id, user_id, user_id, user_id),
                )
                rows = cur.fetchall()

            chats = []
            for r in rows:
                chats.append({
                    "id": r[0],
                    "is_group": r[1],
                    "group_name": r[2],
                    "group_avatar": r[3],
                    "updated_at": str(r[4]) if r[4] else None,
                    "last_message_at": str(r[5]) if r[5] else None,
                    "other_user": {
                        "id": r[6],
                        "name": r[7],
                        "avatar": r[8],
                        "status": r[9],
                    } if not r[1] else None,
                    "last_message": {
                        "content": r[10],
                        "type": r[11],
                        "at": str(r[12]) if r[12] else None,
                    } if r[10] else None,
                    "unread_count": r[13] or 0,
                })
            return json_ok({"chats": chats})

        # POST / — создать чат
        if method == "POST" and (path.endswith("/chats") or path == "/"):
            target_user_id = body.get("user_id")
            is_group = body.get("is_group", False)
            group_name = body.get("group_name")

            if not is_group:
                if not target_user_id:
                    return json_err("Укажите user_id для приватного чата")
                if target_user_id == user_id:
                    return json_err("Нельзя создать чат с собой")

                # Проверяем — уже есть приватный чат?
                with conn.cursor() as cur:
                    cur.execute(
                        f"""SELECT c.id FROM {SCHEMA}.xvchat_chats c
                            JOIN {SCHEMA}.xvchat_chat_participants cp1 ON cp1.chat_id=c.id AND cp1.user_id=%s
                            JOIN {SCHEMA}.xvchat_chat_participants cp2 ON cp2.chat_id=c.id AND cp2.user_id=%s
                            WHERE c.is_group=FALSE LIMIT 1""",
                        (user_id, target_user_id),
                    )
                    existing = cur.fetchone()

                if existing:
                    return json_ok({"chat_id": existing[0], "existing": True})

                chat_id = gen_id("c")
                with conn.cursor() as cur:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.xvchat_chats (id, is_group, created_by) VALUES (%s, FALSE, %s)",
                        (chat_id, user_id),
                    )
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.xvchat_chat_participants (id, chat_id, user_id, is_admin) VALUES (%s, %s, %s, TRUE)",
                        (gen_id("cp"), chat_id, user_id),
                    )
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.xvchat_chat_participants (id, chat_id, user_id) VALUES (%s, %s, %s)",
                        (gen_id("cp"), chat_id, target_user_id),
                    )
                conn.commit()
                return json_ok({"chat_id": chat_id, "existing": False}, 201)

        # GET /search?q=... — поиск пользователей
        if method == "GET" and path.endswith("/search"):
            q = params.get("q", "").strip()
            if len(q) < 2:
                return json_ok({"users": []})
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, custom_id, name, avatar, status FROM {SCHEMA}.xvchat_users
                        WHERE id != %s AND (
                            name ILIKE %s OR email ILIKE %s OR custom_id ILIKE %s
                        ) LIMIT 20""",
                    (user_id, f"%{q}%", f"%{q}%", f"%{q}%"),
                )
                rows = cur.fetchall()
            users = [
                {"id": r[0], "custom_id": r[1], "name": r[2], "avatar": r[3], "status": r[4]}
                for r in rows
            ]
            return json_ok({"users": users})

        # GET /user/:id
        if method == "GET" and "/user/" in path:
            parts = path.rstrip("/").split("/")
            target_id = parts[-1]
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, custom_id, name, avatar, bio, status, last_seen FROM {SCHEMA}.xvchat_users WHERE id=%s",
                    (target_id,),
                )
                row = cur.fetchone()
            if not row:
                return json_err("Пользователь не найден", 404)
            return json_ok({
                "user": {
                    "id": row[0], "custom_id": row[1], "name": row[2],
                    "avatar": row[3], "bio": row[4], "status": row[5],
                    "last_seen": str(row[6]) if row[6] else None,
                }
            })

        return json_err("Маршрут не найден", 404)

    except Exception as e:
        conn.rollback()
        return json_err(f"Ошибка сервера: {e}", 500)
    finally:
        conn.close()
