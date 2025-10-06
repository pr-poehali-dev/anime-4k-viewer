-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

-- Создание таблицы админов
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{"edit_content": true, "manage_users": true, "manage_anime": true, "manage_site": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Создание таблицы настроек сайта
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by VARCHAR(255) REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка дефолтных настроек сайта
INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_title', '"DokiDokiHub"'),
('site_description', '"Дивіться аніме в 4K без реклами"'),
('show_featured_section', 'true'),
('show_popular_section', 'true'),
('show_continue_section', 'true'),
('max_rating', '10'),
('enable_comments', 'true'),
('enable_ratings', 'true')
ON CONFLICT (setting_key) DO NOTHING;

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);