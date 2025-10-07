-- Таблица друзей
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  friend_id VARCHAR NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- Таблица приватных сообщений
CREATE TABLE IF NOT EXISTS private_messages (
  id SERIAL PRIMARY KEY,
  sender_id VARCHAR NOT NULL,
  recipient_id VARCHAR NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  CHECK (sender_id != recipient_id)
);

CREATE INDEX idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX idx_private_messages_recipient ON private_messages(recipient_id);
CREATE INDEX idx_private_messages_created_at ON private_messages(created_at);