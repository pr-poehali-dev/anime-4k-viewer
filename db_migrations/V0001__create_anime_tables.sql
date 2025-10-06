CREATE TABLE IF NOT EXISTS anime (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  episodes INTEGER NOT NULL DEFAULT 1,
  rating DECIMAL(3, 1) DEFAULT 0.0,
  description TEXT,
  genres TEXT[],
  release_year INTEGER,
  status VARCHAR(50) DEFAULT 'ongoing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  anime_id INTEGER NOT NULL,
  current_episode INTEGER DEFAULT 1,
  watch_time INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_anime_title ON anime(title);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_anime_id ON user_progress(anime_id);