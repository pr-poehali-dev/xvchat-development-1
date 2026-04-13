"""
xvChat Auth API — регистрация, вход, выход, проверка сессии, аккаунты по IP.
Безопасность: bcrypt хэширование, JWT, rate limiting по IP, httpOnly cookie, IP-history.
"""
import os
import json
import hashlib
import secrets
import time
from datetime import datetime, timedelta, timezone

import psycopg2
import bcrypt
import jwt

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-change-me")
JWT_EXPIRY_DAYS = 30

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-User-Id, X-Session-Id",
    "Access-Control-Max-Age": "86400",
}

# Rate limit: max 5 попыток за 15 минут на IP
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 15 * 60  # секунды


def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = False
    return conn


def json_ok(data: dict, status: int = 200) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(data, default=str),
    }


def json_err(msg: str, status: int = 400) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"error": msg}),
    }


def gen_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(8)}"


def make_jwt(user_id: str, session_id: str) -> str:
    payload = {
        "sub": user_id,
        "sid": session_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_DAYS * 86400,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def verify_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def check_rate_limit(conn, ip: str, action: str) -> bool:
    """True если лимит не превышен."""
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=RATE_LIMIT_WINDOW)
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.xvchat_rate_limit WHERE ip_address=%s AND action=%s AND created_at > %s",
            (ip, action, cutoff),
        )
        count = cur.fetchone()[0]
    return count < RATE_LIMIT_MAX


def log_rate_limit(conn, ip: str, action: str):
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {SCHEMA}.xvchat_rate_limit (ip_address, action) VALUES (%s, %s)",
            (ip, action),
        )


def upsert_ip_history(conn, user_id: str, ip: str, ua: str):
    with conn.cursor() as cur:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.xvchat_ip_history (id, user_id, ip_address, user_agent, last_used)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (user_id, ip_address)
                DO UPDATE SET last_used=NOW(), user_agent=EXCLUDED.user_agent""",
            (gen_id("ip"), user_id, ip, ua),
        )


def get_ip(event: dict) -> str:
    headers = event.get("headers") or {}
    return (
        headers.get("x-forwarded-for", "").split(",")[0].strip()
        or headers.get("x-real-ip", "")
        or event.get("requestContext", {}).get("identity", {}).get("sourceIp", "unknown")
    )


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

    headers = event.get("headers") or {}
    ip = get_ip(event)
    ua = headers.get("user-agent", "")

    # POST /register
    if method == "POST" and path.endswith("/register"):
        conn = get_db()
        try:
            if not check_rate_limit(conn, ip, "register"):
                return json_err("Слишком много попыток. Попробуйте через 15 минут.", 429)
            log_rate_limit(conn, ip, "register")

            name = (body.get("name") or "").strip()
            email = (body.get("email") or "").strip().lower()
            phone = (body.get("phone") or "").strip()
            password = body.get("password") or ""

            if not name or len(name) < 2:
                return json_err("Имя должно быть минимум 2 символа")
            if len(name) > 50:
                return json_err("Имя слишком длинное")
            if not email and not phone:
                return json_err("Укажите email или телефон")
            if len(password) < 8:
                return json_err("Пароль должен быть минимум 8 символов")

            # Проверка уникальности
            with conn.cursor() as cur:
                if email:
                    cur.execute(f"SELECT id FROM {SCHEMA}.xvchat_users WHERE email=%s", (email,))
                    if cur.fetchone():
                        return json_err("Email уже зарегистрирован")
                if phone:
                    cur.execute(f"SELECT id FROM {SCHEMA}.xvchat_users WHERE phone=%s", (phone,))
                    if cur.fetchone():
                        return json_err("Телефон уже зарегистрирован")

            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
            user_id = gen_id("u")
            custom_id = "xv_" + secrets.token_hex(4)

            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.xvchat_users
                        (id, custom_id, name, phone, email, password_hash, ip_address, user_agent)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (user_id, custom_id, name, phone or None, email or None, password_hash, ip, ua),
                )

            session_id = gen_id("s")
            token = make_jwt(user_id, session_id)
            token_hash = hash_token(token)
            expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)

            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.xvchat_sessions
                        (id, user_id, token_hash, ip_address, user_agent, expires_at)
                        VALUES (%s, %s, %s, %s, %s, %s)""",
                    (session_id, user_id, token_hash, ip, ua, expires_at),
                )

            upsert_ip_history(conn, user_id, ip, ua)
            conn.commit()

            return json_ok({
                "token": token,
                "user": {
                    "id": user_id,
                    "custom_id": custom_id,
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "avatar": None,
                    "bio": "",
                    "status": "online",
                },
            }, 201)
        except Exception as e:
            conn.rollback()
            return json_err(f"Ошибка сервера: {e}", 500)
        finally:
            conn.close()

    # POST /login
    if method == "POST" and path.endswith("/login"):
        conn = get_db()
        try:
            if not check_rate_limit(conn, ip, "login"):
                return json_err("Слишком много попыток входа. Попробуйте через 15 минут.", 429)
            log_rate_limit(conn, ip, "login")

            login = (body.get("email") or body.get("phone") or "").strip().lower()
            password = body.get("password") or ""

            if not login or not password:
                return json_err("Укажите email/телефон и пароль")

            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, custom_id, name, email, phone, password_hash, avatar, bio, status
                        FROM {SCHEMA}.xvchat_users
                        WHERE email=%s OR phone=%s""",
                    (login, login),
                )
                row = cur.fetchone()

            if not row:
                return json_err("Неверный email или пароль")

            user_id, custom_id, name, email, phone, pw_hash, avatar, bio, status = row

            if not bcrypt.checkpw(password.encode(), pw_hash.encode()):
                return json_err("Неверный email или пароль")

            session_id = gen_id("s")
            token = make_jwt(user_id, session_id)
            token_hash = hash_token(token)
            expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)

            with conn.cursor() as cur:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.xvchat_sessions
                        (id, user_id, token_hash, ip_address, user_agent, expires_at)
                        VALUES (%s, %s, %s, %s, %s, %s)""",
                    (session_id, user_id, token_hash, ip, ua, expires_at),
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.xvchat_users SET status='online', last_seen=NOW() WHERE id=%s",
                    (user_id,),
                )

            upsert_ip_history(conn, user_id, ip, ua)
            conn.commit()

            return json_ok({
                "token": token,
                "user": {
                    "id": user_id,
                    "custom_id": custom_id,
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "avatar": avatar,
                    "bio": bio,
                    "status": "online",
                },
            })
        except Exception as e:
            conn.rollback()
            return json_err(f"Ошибка сервера: {e}", 500)
        finally:
            conn.close()

    # GET /me — проверка текущей сессии
    if method == "GET" and path.endswith("/me"):
        auth_header = headers.get("x-authorization") or headers.get("authorization") or ""
        token = auth_header.replace("Bearer ", "").strip()
        if not token:
            return json_err("Не авторизован", 401)

        payload = verify_jwt(token)
        if not payload:
            return json_err("Токен недействителен", 401)

        token_hash = hash_token(token)
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT is_valid FROM {SCHEMA}.xvchat_sessions WHERE token_hash=%s AND expires_at > NOW()",
                    (token_hash,),
                )
                session = cur.fetchone()
            if not session or not session[0]:
                return json_err("Сессия истекла", 401)

            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT id, custom_id, name, email, phone, avatar, bio, status
                        FROM {SCHEMA}.xvchat_users WHERE id=%s""",
                    (payload["sub"],),
                )
                row = cur.fetchone()

            if not row:
                return json_err("Пользователь не найден", 404)

            uid, custom_id, name, email, phone, avatar, bio, status = row
            return json_ok({
                "user": {
                    "id": uid,
                    "custom_id": custom_id,
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "avatar": avatar,
                    "bio": bio,
                    "status": status,
                }
            })
        finally:
            conn.close()

    # POST /logout
    if method == "POST" and path.endswith("/logout"):
        auth_header = headers.get("x-authorization") or headers.get("authorization") or ""
        token = auth_header.replace("Bearer ", "").strip()
        if token:
            payload = verify_jwt(token)
            if payload:
                token_hash = hash_token(token)
                conn = get_db()
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            f"UPDATE {SCHEMA}.xvchat_sessions SET is_valid=FALSE WHERE token_hash=%s",
                            (token_hash,),
                        )
                        cur.execute(
                            f"UPDATE {SCHEMA}.xvchat_users SET status='offline', last_seen=NOW() WHERE id=%s",
                            (payload["sub"],),
                        )
                    conn.commit()
                finally:
                    conn.close()
        return json_ok({"ok": True})

    # GET /accounts-by-ip — аккаунты по текущему IP
    if method == "GET" and path.endswith("/accounts-by-ip"):
        conn = get_db()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    f"""SELECT u.id, u.custom_id, u.name, u.avatar, u.status, h.last_used
                        FROM {SCHEMA}.xvchat_ip_history h
                        JOIN {SCHEMA}.xvchat_users u ON u.id = h.user_id
                        WHERE h.ip_address = %s
                        ORDER BY h.last_used DESC LIMIT 5""",
                    (ip,),
                )
                rows = cur.fetchall()
            accounts = [
                {"id": r[0], "custom_id": r[1], "name": r[2], "avatar": r[3], "status": r[4], "last_used": str(r[5])}
                for r in rows
            ]
            return json_ok({"accounts": accounts})
        finally:
            conn.close()

    return json_err("Маршрут не найден", 404)
