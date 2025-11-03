# Hướng dẫn Setup Database PostgreSQL

## Yêu cầu

- Node.js và npm/pnpm đã được cài đặt
- PostgreSQL đã được cài đặt và chạy trên máy

## Bước 1: Cài đặt PostgreSQL

Nếu chưa cài đặt PostgreSQL, bạn có thể:

### Windows:
1. Tải PostgreSQL từ: https://www.postgresql.org/download/windows/
2. Hoặc sử dụng PostgreSQL Installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

### macOS:
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Bước 2: Tạo Database

1. Mở terminal/command prompt và kết nối với PostgreSQL:
```bash
psql -U postgres
```

2. Tạo database mới:
```sql
CREATE DATABASE topjob_db;
```

3. (Tùy chọn) Tạo user riêng cho project:
```sql
CREATE USER topjob_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE topjob_db TO topjob_user;
```

4. Thoát psql:
```sql
\q
```

## Bước 3: Cấu hình Environment Variables

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Mở file `.env` và cập nhật thông tin database của bạn:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=topjob_db
```

## Bước 4: Kiểm tra kết nối

1. Khởi động ứng dụng:
```bash
pnpm start:dev
```

2. Nếu kết nối thành công, bạn sẽ thấy log không có lỗi database.

## Bước 5: Tạo Migration (Tùy chọn)

Khi bạn tạo entity mới, có thể tạo migration:

1. Cài đặt TypeORM CLI (nếu chưa có):
```bash
npm install -g typeorm
```

2. Tạo migration:
```bash
typeorm migration:create src/database/migrations/InitialMigration
```

3. Chạy migration:
```bash
typeorm migration:run
```

## Lưu ý quan trọng

- **Synchronize**: Trong development, `synchronize: true` sẽ tự động sync schema với database. **Tắt trong production**.
- **Migrations**: Trong production, luôn sử dụng migrations thay vì synchronize.
- **Backup**: Luôn backup database trước khi chạy migrations trong production.

## Troubleshooting

### Lỗi kết nối không được
- Kiểm tra PostgreSQL đang chạy: `pg_isready` hoặc `psql -U postgres`
- Kiểm tra firewall có chặn port 5432 không
- Kiểm tra username/password trong file `.env`

### Lỗi permission denied
- Đảm bảo user có quyền truy cập database
- Kiểm tra lại password

### Lỗi database không tồn tại
- Tạo database trước khi chạy ứng dụng
- Kiểm tra tên database trong `.env`

