CREATE TABLE IF NOT EXISTS xvchat_sessions (
    id TEXT PRIMARY KEY DEFAULT ('s_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
    user_id TEXT NOT NULL REFERENCES xvchat_users(id),
    token_hash TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS xvchat_ip_history (
    id TEXT PRIMARY KEY DEFAULT ('ip_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
    user_id TEXT NOT NULL REFERENCES xvchat_users(id),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, ip_address)
);

CREATE TABLE IF NOT EXISTS xvchat_rate_limit (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xvchat_sessions_token ON xvchat_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_xvchat_sessions_user ON xvchat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_xvchat_rate_limit ON xvchat_rate_limit(ip_address, action, created_at);
CREATE INDEX IF NOT EXISTS idx_xvchat_ip_history ON xvchat_ip_history(ip_address);