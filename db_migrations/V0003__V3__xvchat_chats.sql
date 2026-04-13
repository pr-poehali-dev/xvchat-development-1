CREATE TABLE IF NOT EXISTS xvchat_chats (
    id TEXT PRIMARY KEY DEFAULT ('c_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
    is_group BOOLEAN DEFAULT FALSE,
    group_name TEXT,
    created_by TEXT REFERENCES xvchat_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);