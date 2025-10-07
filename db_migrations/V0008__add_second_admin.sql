-- Добавляем второго админа (обновляем существующего пользователя)
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@club.school';