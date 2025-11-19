# Authentication API - Use Case UC-REG-01

Tài liệu này mô tả cách sử dụng API đăng ký ứng viên và xác thực email theo Use Case UC-REG-01 và UC-REG-03.

## Tổng quan

### Use Case UC-REG-01: Đăng ký ứng viên

**Flow chính:**

1. Khách chọn "Đăng ký" và chọn vai trò "Ứng viên"
2. System hiển thị form đăng ký (Họ Tên, Email, Mật khẩu, Xác nhận mật khẩu)
3. Khách điền thông tin và nhấn "Đăng ký"
4. System validate dữ liệu
5. System kiểm tra email chưa tồn tại
6. System mã hóa mật khẩu
7. System tạo user với status = "PENDING_EMAIL_VERIFICATION"
8. System tạo candidate_profile
9. System gửi email OTP (UC-REG-03)

### Use Case UC-REG-03: Xác thực Email

**Flow chính:**

1. Khách nhận email chứa OTP
2. Khách nhập OTP trên trang xác thực
3. System validate OTP
4. System cập nhật user.status = "ACTIVE"
5. System gửi email chào mừng
6. System chuyển hướng đến trang login

## API Endpoints

### 1. Đăng ký tài khoản ứng viên

**Endpoint:** `POST /auth/register/candidate`

**Request Body:**

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "candidate@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

**Validation Rules:**

- `fullName`:
  - Required, không được để trống
  - Tối thiểu 2 ký tự
- `email`:
  - Required, không được để trống
  - Phải đúng định dạng email
  - Phải unique (chưa tồn tại trong database)
- `password`:
  - Required, không được để trống
  - Tối thiểu 8 ký tự
  - Phải chứa ít nhất: 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
- `confirmPassword`:
  - Required, không được để trống
  - Phải khớp với password

**Success Response (201 Created):**

```json
{
  "userId": "1",
  "email": "candidate@example.com",
  "role": "candidate",
  "status": "pending_email_verification",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  "otpExpiresAt": "2025-11-18T10:30:00.000Z"
}
```

**Error Responses:**

_400 Bad Request - Validation Error:_

```json
{
  "statusCode": 400,
  "message": [
    "Mật khẩu xác nhận không khớp",
    "Email không đúng định dạng",
    "Mật khẩu phải có ít nhất 8 ký tự"
  ],
  "error": "Bad Request"
}
```

_409 Conflict - Email Already Exists:_

```json
{
  "statusCode": 409,
  "message": "Email này đã được sử dụng",
  "error": "Conflict"
}
```

### 2. Xác thực email

**Endpoint:** `POST /auth/verify-email`

**Request Body:**

```json
{
  "email": "candidate@example.com",
  "otpCode": "123456"
}
```

**Validation Rules:**

- `email`: Required, đúng định dạng email
- `otpCode`: Required, đúng 6 ký tự

**Success Response (200 OK):**

```json
{
  "verified": true,
  "message": "Xác thực email thành công!",
  "userId": "1",
  "email": "candidate@example.com"
}
```

**Error Responses:**

_400 Bad Request - Invalid OTP:_

```json
{
  "statusCode": 400,
  "message": "Mã OTP không đúng. Bạn còn 4 lần thử.",
  "error": "Bad Request"
}
```

_400 Bad Request - Expired OTP:_

```json
{
  "statusCode": 400,
  "message": "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
  "error": "Bad Request"
}
```

_404 Not Found - User Not Found:_

```json
{
  "statusCode": 404,
  "message": "Không tìm thấy tài khoản với email này",
  "error": "Not Found"
}
```

### 3. Gửi lại mã OTP

**Endpoint:** `POST /auth/resend-otp`

**Request Body:**

```json
{
  "email": "candidate@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Mã OTP mới đã được gửi đến email của bạn",
  "expiresAt": "2025-11-18T10:35:00.000Z"
}
```

**Error Responses:**

_400 Bad Request - Already Verified:_

```json
{
  "statusCode": 400,
  "message": "Email đã được xác thực",
  "error": "Bad Request"
}
```

_400 Bad Request - Rate Limit:_

```json
{
  "statusCode": 400,
  "message": "Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 1 giờ.",
  "error": "Bad Request"
}
```

## Flow hoàn chỉnh

### Bước 1: Đăng ký tài khoản

```bash
curl -X POST http://localhost:3000/auth/register/candidate \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "candidate@example.com",
    "password": "Password@123",
    "confirmPassword": "Password@123"
  }'
```

**Kết quả:**

- Tài khoản được tạo với status = "pending_email_verification"
- Email chứa OTP được gửi đến candidate@example.com
- OTP có hiệu lực 5 phút

### Bước 2: Kiểm tra email và lấy OTP

Kiểm tra email để lấy mã OTP 6 chữ số (ví dụ: `123456`)

### Bước 3: Xác thực email với OTP

```bash
curl -X POST http://localhost:3000/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "otpCode": "123456"
  }'
```

**Kết quả:**

- User status được cập nhật thành "active"
- isVerified = true
- emailVerifiedAt được set
- Email chào mừng được gửi

### Bước 4 (Optional): Gửi lại OTP nếu hết hạn

```bash
curl -X POST http://localhost:3000/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com"
  }'
```

## Business Rules

### OTP Rules

- **Length:** 6 chữ số
- **Expiry:** 5 phút
- **Max Attempts:** 5 lần nhập sai
- **Rate Limit:** Tối đa 5 OTP/giờ cho mỗi email
- **Reusability:** OTP chỉ sử dụng được 1 lần
- **Invalidation:** OTP cũ bị vô hiệu hóa khi tạo OTP mới

### Password Rules

- **Min Length:** 8 ký tự
- **Required:**
  - Ít nhất 1 chữ hoa (A-Z)
  - Ít nhất 1 chữ thường (a-z)
  - Ít nhất 1 chữ số (0-9)
  - Ít nhất 1 ký tự đặc biệt (@$!%\*?&)
- **Storage:** Mật khẩu được hash bằng bcrypt (10 salt rounds)

### Email Rules

- **Format:** Phải đúng định dạng email chuẩn
- **Uniqueness:** Email không được trùng trong hệ thống
- **Case Insensitive:** Email được lưu và so sánh dạng lowercase

### User Status Flow

1. **pending_email_verification** - Sau khi đăng ký
2. **active** - Sau khi xác thực email thành công

## Security Considerations

1. **Password Hashing:** Sử dụng bcrypt với 10 salt rounds
2. **OTP Security:**
   - OTP được tạo ngẫu nhiên
   - Giới hạn số lần thử
   - Tự động hết hạn sau 5 phút
   - Rate limiting để chống spam
3. **Input Validation:** Tất cả input được validate kỹ lưỡng
4. **Email Verification:** Bắt buộc xác thực email trước khi sử dụng tài khoản
5. **Transaction Safety:** Sử dụng database transaction cho việc tạo user + candidate

## Testing

### Manual Testing

1. Test đăng ký thành công
2. Test email đã tồn tại
3. Test password không khớp
4. Test OTP đúng
5. Test OTP sai
6. Test OTP hết hạn
7. Test OTP đã sử dụng
8. Test gửi lại OTP
9. Test rate limit OTP

### Expected Email Templates

**OTP Email:**

- Subject: `[TopJob] Mã xác thực Xác thực email`
- Contains: 6-digit OTP code
- Contains: Expiry time (5 minutes)
- Contains: Security warnings

**Welcome Email:**

- Subject: `[TopJob] Chào mừng bạn đến với TopJob!`
- Contains: User's full name
- Contains: Feature highlights
- Contains: Getting started guide

## Architecture

### Layers

```
Controller (auth.controller.ts)
    ↓
Use Cases (register-candidate.usecase.ts, verify-email.usecase.ts)
    ↓
Services (otp.service.ts, email.service.ts)
    ↓
Repositories (TypeORM)
    ↓
Database (PostgreSQL)
```

### Files Structure

```
src/auth/
├── dto/
│   ├── register-candidate.dto.ts    # Request DTO cho đăng ký
│   ├── register-response.dto.ts     # Response DTO cho đăng ký
│   ├── verify-email.dto.ts          # DTOs cho xác thực email
│   └── index.ts
├── services/
│   ├── email.service.ts             # Gửi email (OTP, welcome)
│   ├── otp.service.ts               # Quản lý OTP
│   └── index.ts
├── usecases/
│   ├── register-candidate.usecase.ts # UC-REG-01
│   ├── verify-email.usecase.ts       # UC-REG-03
│   └── index.ts
├── validators/
│   └── match-password.validator.ts   # Custom validator
├── auth.controller.ts                # REST endpoints
└── auth.module.ts                    # Module definition
```

## Environment Variables

Đảm bảo cấu hình các biến môi trường sau trong `.env`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=topjob

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM="TopJob <noreply@topjob.com>"

# App
APP_NAME=TopJob
APP_PORT=3000
```

## Next Steps

Sau khi hoàn thành UC-REG-01 và UC-REG-03, có thể implement:

1. **UC-REG-02:** Đăng ký nhà tuyển dụng
2. **UC-AUTH-01:** Đăng nhập
3. **UC-AUTH-02:** Đăng xuất
4. **UC-AUTH-03:** Quên mật khẩu
5. **UC-CAN-01:** Hoàn thiện hồ sơ ứng viên
