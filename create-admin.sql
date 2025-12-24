-- File: create-admin.sql
-- Hướng dẫn: Chạy query này trong PostgreSQL client (pgAdmin, DBeaver, hoặc psql)

-- Bước 1: Tạo user admin
-- Lưu ý: Password đã được hash bằng bcrypt (password gốc: Admin@123)
-- Bạn cần hash lại password của bạn trước khi insert

INSERT INTO "users" 
  ("email", "password_hash", "role", "status", "is_verified", "email_verified_at", "created_at", "updated_at") 
VALUES 
  ('admin@topjob.com', '$2b$10$YourHashedPasswordHere', 'admin', 'active', true, NOW(), NOW(), NOW())
RETURNING id;

-- Sau khi chạy, lưu lại ID của admin user để xác nhận
SELECT id, email, role, status FROM "users" WHERE role = 'admin';
