CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP,
    is_active BOOLEAN
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites_count INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS watch_count INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ratings_count INTEGER;
