CREATE TABLE IF NOT EXISTS xvchat_users (
    id TEXT PRIMARY KEY DEFAULT ('u_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
    custom_id TEXT UNIQUE NOT NULL DEFAULT ('xv_' || substr(md5(random()::text), 1, 8)),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    bio TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);