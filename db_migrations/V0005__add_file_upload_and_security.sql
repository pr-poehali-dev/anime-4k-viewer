-- Таблица для баннеров
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для загруженных файлов
CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by VARCHAR(255) REFERENCES users(id),
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавление полей для загрузки файлов в anime
ALTER TABLE anime ADD COLUMN IF NOT EXISTS cover_file_id INTEGER REFERENCES uploaded_files(id);
ALTER TABLE anime ADD COLUMN IF NOT EXISTS video_file_id INTEGER REFERENCES uploaded_files(id);

-- Таблица для логов автозащиты
CREATE TABLE IF NOT EXISTS auto_security_logs (
    id SERIAL PRIMARY KEY,
    threat_type VARCHAR(100) NOT NULL,
    threat_level VARCHAR(20) NOT NULL,
    source_ip VARCHAR(45),
    details JSONB,
    action_taken VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для автоматических действий безопасности
CREATE TABLE IF NOT EXISTS security_actions (
    id SERIAL PRIMARY KEY,
    trigger_type VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставка правил автозащиты
INSERT INTO security_actions (trigger_type, action_type, config) VALUES
('brute_force_detected', 'auto_password_change', '{"threshold": 10, "window_minutes": 5}'::jsonb),
('sql_injection_attempt', 'block_ip', '{"duration_hours": 24}'::jsonb),
('ddos_detected', 'rate_limit', '{"max_requests": 100, "window_seconds": 60}'::jsonb),
('suspicious_login_pattern', 'require_2fa', '{"enabled": true}'::jsonb),
('password_leak_detected', 'force_password_reset', '{"notify_user": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_uploaded_files_entity ON uploaded_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploader ON uploaded_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, position);
CREATE INDEX IF NOT EXISTS idx_auto_security_logs_type ON auto_security_logs(threat_type, created_at);
CREATE INDEX IF NOT EXISTS idx_auto_security_logs_ip ON auto_security_logs(source_ip, created_at);

-- Создание суперадмина
INSERT INTO users (id, email, password_hash, username, provider, provider_id, is_admin, email_verified, is_active)
VALUES (
    'superadmin-001',
    'admin@dokidokihub.com',
    '$2b$12$YQ7GZ4zN.FqP3K5rJ8Y0xuZD6vJ8mYZqQ0xQZ5Z6Y0xuZD6vJ8mYZ',
    'Главный Администратор',
    'email',
    'superadmin-001',
    TRUE,
    TRUE,
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = '$2b$12$YQ7GZ4zN.FqP3K5rJ8Y0xuZD6vJ8mYZqQ0xQZ5Z6Y0xuZD6vJ8mYZ',
    is_admin = TRUE,
    email_verified = TRUE,
    is_active = TRUE;