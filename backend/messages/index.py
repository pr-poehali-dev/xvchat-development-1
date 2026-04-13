"""
xvChat Messages API — отправка, получение, пометка прочитанными, polling обновлений.
Long-polling: GET /poll?chat_id=X&after=<timestamp> — ждёт до 20 сек новых сообщений.
"""
import os
import json
import hashlib
import secrets
import time
from datetime import datetime, timezone

import psycopg2
import jwt

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-change-me")

# Простой мат-фильтр (RU + EN базовые слова)
BAD_WORDS = [
    "бля", "хуй", "пизда", "ебать", "залупа", "мудак", "пидор", "сука", "блядь",
    "fuck", "shit", "bitch", "asshole", "cunt",
]

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


def gen_id(prefix):
    return f"{prefix}_{secrets.token_hex(10)}"


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


def filter_content(text: str) -> str:
    """Заменяет мат звёздочками."""
    text_lower = text.lower()
    for word in BAD_WORDS:
        if word in text_lower:
            idx = text_lower.find(word)
            text = text[:idx] + "*" * len(word) + text[idx + len(word):]
            text_lower = text.lower()
    return text


def check_participant(conn, user_id, chat_id):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.xvchat_chat_participants WHERE user_id=%s AND chat_id=%s",
            (user_id, chat_id),
        )
        return cur.fetchone() is not None


def fetch_messages(conn, chat_id, limit=50, before=None, after=None):
    with conn.cursor() as cur:
        if after:
            cur.execute(
                f"""SELECT m.id, m.chat_id, m.sender_id, m.content, m.content_type,
                           m.file_url, m.file_name, m.file_size, m.duration,
                           m.is_read, m.read_at, m.created_at,
                           u.name as sender_name, u.avatar as sender_avatar, u.custom_id as sender_custom_id
                    FROM {SCHEMA}.xvchat_messages m
                    JOIN {SCHEMA}.xvchat_users u ON u.id = m.sender_id
                    WHERE m.chat_id=%s AND m.hidden=FALSE AND m.created_at > %s
                    ORDER BY m.created_at ASC LIMIT %s""",
                (chat_id, after, limit),
            )
        elif before:
            cur.execute(
                f"""SELECT m.id, m.chat_id, m.sender_id, m.content, m.content_type,
                           m.file_url, m.file_name, m.file_size, m.duration,
                           m.is_read, m.read_at, m.created_at,
                           u.name as sender_name, u.avatar as sender_avatar, u.custom_id as sender_custom_id
                    FROM {SCHEMA}.xvchat_messages m
                    JOIN {SCHEMA}.xvchat_users u ON u.id = m.sender_id
                    WHERE m.chat_id=%s AND m.hidden=FALSE AND m.created_at < %s
                    ORDER BY m.created_at DESC LIMIT %s""",
                (chat_id, before, limit),
            )
        else:
            cur.execute(
                f"""SELECT m.id, m.chat_id, m.sender_id, m.content, m.content_type,
                           m.file_url, m.file_name, m.file_size, m.duration,
                           m.is_read, m.read_at, m.created_at,
                           u.name as sender_name, u.avatar as sender_avatar, u.custom_id as sender_custom_id
                    FROM {SCHEMA}.xvchat_messages m
                    JOIN {SCHEMA}.xvchat_users u ON u.id = m.sender_id
                    WHERE m.chat_id=%s AND m.hidden=FALSE
                    ORDER BY m.created_at DESC LIMIT %s""",
                (chat_id, limit),
            )
        rows = cur.fetchall()

    msgs = []
    for r in rows:
        msgs.append({
            "id": r[0], "chat_id": r[1], "sender_id": r[2],
            "content": r[3], "content_type": r[4],
            "file_url": r[5], "file_name": r[6], "file_size": r[7], "duration": r[8],
            "is_read": r[9], "read_at": str(r[10]) if r[10] else None,
            "created_at": str(r[11]),
            "sender": {"name": r[12], "avatar": r[13], "custom_id": r[14]},
        })
    return msgs


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

        # GET /?chat_id=X&limit=50&before=<ts> — история сообщений
        if method == "GET" and not path.endswith("/poll"):
            chat_id = params.get("chat_id")
            if not chat_id:
                return json_err("Укажите chat_id")
            if not check_participant(conn, user_id, chat_id):
                return json_err("Нет доступа к чату", 403)

            limit = min(int(params.get("limit", 50)), 100)
            before = params.get("before")
            after = params.get("after")

            msgs = fetch_messages(conn, chat_id, limit=limit, before=before, after=after)

            # Помечаем прочитанными при загрузке
            with conn.cursor() as cur:
                cur.execute(
                    f"""UPDATE {SCHEMA}.xvchat_messages
                        SET is_read=TRUE, read_at=NOW()
                        WHERE chat_id=%s AND sender_id!=%s AND is_read=FALSE AND hidden=FALSE""",
                    (chat_id, user_id),
                )
            conn.commit()

            return json_ok({"messages": msgs, "total": len(msgs)})

        # POST / — отправить сообщение
        if method == "POST":
            chat_id = body.get("chat_id")
            content = (body.get("content") or "").strip()
            content_type = body.get("content_type", "text")
            file_url = body.get("file_url")
            file_name = body.get("file_name")
            file_size = body.get("file_size")
            temp_id = body.get("temp_id", gen_id("tmp"))

            if not chat_id:
                return json_err("Укажите chat_id")
            if not content and not file_url:
                return json_err("Сообщение не может быть пустым")
            if content and len(content) > 10000:
                return json_err("Сообщение слишком длинное (макс. 10000 символов)")

            if not check_participant(conn, user_id, chat_id):
                return json_err("Нет доступа к чату", 403)

            # Фильтр мата
            if content:
                content = filter_content(content)

            msg_id = gen_id("m")
            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.xvchat_messages
                        (id, chat_id, sender_id, content, content_type, file_url, file_name, file_size)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (msg_id, chat_id, user_id, content, content_type, file_url, file_name, file_size),
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.xvchat_chats SET updated_at=NOW(), last_message_at=NOW() WHERE id=%s",
                    (chat_id,),
                )
                # Получаем полное сообщение с данными отправителя
                cur.execute(
                    f"""SELECT m.id, m.chat_id, m.sender_id, m.content, m.content_type,
                               m.file_url, m.file_name, m.file_size, m.created_at,
                               u.name, u.avatar, u.custom_id
                        FROM {SCHEMA}.xvchat_messages m
                        JOIN {SCHEMA}.xvchat_users u ON u.id = m.sender_id
                        WHERE m.id=%s""",
                    (msg_id,),
                )
                row = cur.fetchone()
            conn.commit()

            message = {
                "id": row[0], "chat_id": row[1], "sender_id": row[2],
                "content": row[3], "content_type": row[4],
                "file_url": row[5], "file_name": row[6], "file_size": row[7],
                "created_at": str(row[8]), "is_read": False,
                "sender": {"name": row[9], "avatar": row[10], "custom_id": row[11]},
                "temp_id": temp_id,
            }
            return json_ok({"message": message, "status": "sent"}, 201)

        # GET /poll?chat_id=X&after=<ts> — long-polling новых сообщений
        if method == "GET" and path.endswith("/poll"):
            chat_id = params.get("chat_id")
            after = params.get("after")
            if not chat_id:
                return json_err("Укажите chat_id")
            if not check_participant(conn, user_id, chat_id):
                return json_err("Нет доступа к чату", 403)

            # Ждём до 20 секунд (polling interval)
            deadline = time.time() + 20
            while time.time() < deadline:
                msgs = fetch_messages(conn, chat_id, limit=50, after=after)
                if msgs:
                    # Помечаем прочитанными
                    new_ids = [m["id"] for m in msgs if m["sender_id"] != user_id]
                    if new_ids:
                        with conn.cursor() as cur:
                            placeholders = ",".join(["%s"] * len(new_ids))
                            cur.execute(
                                f"UPDATE {SCHEMA}.xvchat_messages SET is_read=TRUE, read_at=NOW() WHERE id IN ({placeholders})",
                                new_ids,
                            )
                        conn.commit()
                    return json_ok({"messages": msgs, "has_new": True})
                conn.close()
                time.sleep(1)
                conn = get_db()

            return json_ok({"messages": [], "has_new": False})

        # PUT /read — пометить прочитанными
        if method == "PUT" and path.endswith("/read"):
            chat_id = body.get("chat_id")
            msg_ids = body.get("message_ids", [])
            if not chat_id:
                return json_err("Укажите chat_id")
            if not check_participant(conn, user_id, chat_id):
                return json_err("Нет доступа к чату", 403)

            with conn.cursor() as cur:
                if msg_ids:
                    placeholders = ",".join(["%s"] * len(msg_ids))
                    cur.execute(
                        f"UPDATE {SCHEMA}.xvchat_messages SET is_read=TRUE, read_at=NOW() WHERE id IN ({placeholders}) AND sender_id!=%s",
                        [*msg_ids, user_id],
                    )
                else:
                    cur.execute(
                        f"UPDATE {SCHEMA}.xvchat_messages SET is_read=TRUE, read_at=NOW() WHERE chat_id=%s AND sender_id!=%s AND is_read=FALSE",
                        (chat_id, user_id),
                    )
            conn.commit()
            return json_ok({"ok": True})

        return json_err("Маршрут не найден", 404)

    except Exception as e:
        conn.rollback()
        return json_err(f"Ошибка сервера: {e}", 500)
    finally:
        conn.close()
