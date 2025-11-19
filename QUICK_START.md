# Quick Start Guide - Testing UC-REG-01

## 🚀 Bắt đầu nhanh

### 1. Cài đặt dependencies

```bash
pnpm install
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục root:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=topjob
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true

# Email (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM="TopJob <noreply@topjob.com>"

# App
APP_NAME=TopJob
APP_PORT=3000
NODE_ENV=development
```

**Lưu ý:** Để sử dụng Gmail SMTP, bạn cần:

1. Bật 2-Step Verification cho tài khoản Google
2. Tạo App Password tại: https://myaccount.google.com/apppasswords
3. Sử dụng App Password (không phải password Gmail thường)

### 3. Chạy ứng dụng

```bash
# Development mode
pnpm run start:dev
```

Server sẽ chạy tại: http://localhost:3000

### 4. Test API với cURL

#### 4.1. Đăng ký tài khoản

```bash
curl -X POST http://localhost:3000/auth/register/candidate ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Nguyen Van A\",\"email\":\"test@example.com\",\"password\":\"Password@123\",\"confirmPassword\":\"Password@123\"}"
```

**Expected Response (201):**

```json
{
  "userId": "1",
  "email": "test@example.com",
  "role": "candidate",
  "status": "pending_email_verification",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  "otpExpiresAt": "2025-11-18T10:30:00.000Z"
}
```

#### 4.2. Kiểm tra email

Mở email `test@example.com` và lấy mã OTP 6 chữ số.

#### 4.3. Xác thực email với OTP

```bash
curl -X POST http://localhost:3000/auth/verify-email ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"otpCode\":\"123456\"}"
```

**Expected Response (200):**

```json
{
  "verified": true,
  "message": "Xác thực email thành công!",
  "userId": "1",
  "email": "test@example.com"
}
```

#### 4.4. Gửi lại OTP (nếu cần)

```bash
curl -X POST http://localhost:3000/auth/resend-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\"}"
```

**Expected Response (200):**

```json
{
  "message": "Mã OTP mới đã được gửi đến email của bạn",
  "expiresAt": "2025-11-18T10:35:00.000Z"
}
```

### 5. Test với Postman/Insomnia

Import collection:

**POST** `http://localhost:3000/auth/register/candidate`

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "test@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

**POST** `http://localhost:3000/auth/verify-email`

```json
{
  "email": "test@example.com",
  "otpCode": "123456"
}
```

### 6. Swagger UI

Truy cập Swagger documentation (nếu đã cấu hình):

```
http://localhost:3000/api
```

## 🧪 Test Cases

### ✅ Success Cases

1. **Đăng ký thành công**
   - Nhập đầy đủ thông tin hợp lệ
   - Kết quả: Tạo user + candidate, gửi OTP email

2. **Xác thực OTP thành công**
   - Nhập đúng OTP trong thời hạn
   - Kết quả: User status = ACTIVE, gửi welcome email

3. **Gửi lại OTP thành công**
   - User chưa verify, request resend
   - Kết quả: Gửi OTP mới

### ❌ Error Cases

1. **Email đã tồn tại**

   ```json
   {
     "statusCode": 409,
     "message": "Email này đã được sử dụng",
     "error": "Conflict"
   }
   ```

2. **Password không khớp**

   ```json
   {
     "statusCode": 400,
     "message": ["Mật khẩu xác nhận không khớp"],
     "error": "Bad Request"
   }
   ```

3. **OTP sai**

   ```json
   {
     "statusCode": 400,
     "message": "Mã OTP không đúng. Bạn còn 4 lần thử.",
     "error": "Bad Request"
   }
   ```

4. **OTP hết hạn**

   ```json
   {
     "statusCode": 400,
     "message": "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
     "error": "Bad Request"
   }
   ```

5. **Vượt quá rate limit**
   ```json
   {
     "statusCode": 400,
     "message": "Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 1 giờ.",
     "error": "Bad Request"
   }
   ```

## 📊 Kiểm tra Database

### Kết nối PostgreSQL

```bash
psql -U postgres -d topjob
```

### Query kiểm tra

```sql
-- Xem user vừa tạo
SELECT id, email, role, status, is_verified FROM users;

-- Xem candidate profile
SELECT c.id, c.full_name, u.email
FROM candidates c
JOIN users u ON c.user_id = u.id;

-- Xem OTP records
SELECT email, otp_code, purpose, expires_at, is_used, attempt_count
FROM otp_verifications
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### 1. Không nhận được email

**Nguyên nhân:**

- Sai SMTP credentials
- Gmail chặn "less secure apps"
- Email vào spam folder

**Giải pháp:**

- Kiểm tra MAIL_USER và MAIL_PASSWORD trong .env
- Sử dụng App Password thay vì password thường
- Kiểm tra spam folder

### 2. Database connection error

**Nguyên nhân:**

- PostgreSQL chưa chạy
- Sai database credentials
- Database chưa được tạo

**Giải pháp:**

```bash
# Kiểm tra PostgreSQL đang chạy
pg_isready

# Tạo database
psql -U postgres
CREATE DATABASE topjob;
```

### 3. Module not found error

**Nguyên nhân:**

- Dependencies chưa install

**Giải pháp:**

```bash
# Clear và reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 Development Tips

### 1. Watch mode

```bash
pnpm run start:dev
```

Code sẽ tự động reload khi có thay đổi.

### 2. Debug mode

```bash
pnpm run start:debug
```

Attach debugger tại port 9229.

### 3. Check logs

Xem console output để track:

- Email sending status
- OTP generation
- Database queries (nếu logging=true)

### 4. Clear old OTPs

```sql
DELETE FROM otp_verifications WHERE expires_at < NOW();
```

## 🎯 Next Steps

Sau khi test thành công UC-REG-01:

1. [ ] Implement UC-REG-02: Đăng ký nhà tuyển dụng
2. [ ] Implement UC-AUTH-01: Đăng nhập
3. [ ] Implement UC-AUTH-02: Đăng xuất
4. [ ] Implement UC-AUTH-03: Quên mật khẩu
5. [ ] Viết unit tests
6. [ ] Viết integration tests
7. [ ] Setup CI/CD

## 📚 Documentation

- [API Documentation](./AUTH_API_DOCS.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Database Setup](./DATABASE_SETUP.md)

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:

1. Console logs
2. Database records
3. Email inbox/spam
4. .env configuration
