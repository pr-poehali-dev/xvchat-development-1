CREATE TABLE IF NOT EXISTS xvchat_chat_participants (
    id TEXT PRIMARY KEY DEFAULT ('cp_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
    chat_id TEXT NOT NULL REFERENCES xvchat_chats(id),
    user_id TEXT NOT NULL REFERENCES xvchat_users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(chat_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_xvchat_participants_user ON xvchat_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_xvchat_participants_chat ON xvchat_chat_participants(chat_id);