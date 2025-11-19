# 📚 Swagger API Testing Guide - TopJob Backend

## 🎯 Giới thiệu Swagger

**Swagger UI** là công cụ:

- 📖 **Interactive API Documentation** - Documentation tương tác
- 🧪 **API Testing Tool** - Test API trực tiếp từ browser
- 🔍 **API Explorer** - Khám phá tất cả endpoints có sẵn
- ✅ **Request/Response Validation** - Xem request format và response examples

---

## 🚀 Bước 1: Khởi động Server

```bash
# Development mode
npm run start:dev

# Hoặc
npm start
```

**Output:**

```
╔════════════════════════════════════════════════════════════╗
║                   TopJob Backend Server                    ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Server:        http://localhost:3000                   ║
║  📚 API Docs:      http://localhost:3000/api/docs          ║
║  🔌 API Endpoint:  http://localhost:3000/api               ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🌐 Bước 2: Mở Swagger UI

Truy cập: **http://localhost:3000/api/docs**

Bạn sẽ thấy giao diện Swagger với:

- ✅ Danh sách tất cả API endpoints
- ✅ Grouped by tags (Authentication, Users, Jobs, etc.)
- ✅ Request/Response schemas
- ✅ "Try it out" button để test

---

## 📋 Giao diện Swagger UI

```
┌─────────────────────────────────────────────────────────┐
│  TopJob API Documentation                               │
│  Version 1.0                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔐 Authentication                                      │
│    POST /api/auth/register/candidate                    │
│    POST /api/auth/register/employer                     │
│    POST /api/auth/verify-email                          │
│    POST /api/auth/login                                 │
│    POST /api/auth/logout                                │
│    POST /api/auth/forgot-password                       │
│    POST /api/auth/reset-password                        │
│                                                         │
│  👤 Users (Coming soon)                                 │
│  💼 Jobs (Coming soon)                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Cách Test API với Swagger

### **Example 1: Đăng ký Candidate (Register Candidate)**

#### **Step 1: Mở endpoint**

- Click vào `POST /api/auth/register/candidate`
- Section sẽ expand hiển thị chi tiết

#### **Step 2: Click "Try it out"**

- Nút ở góc phải
- Request body sẽ chuyển sang editable mode

#### **Step 3: Điền thông tin**

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

**Lưu ý:**

- ✅ Email phải unique (chưa đăng ký)
- ✅ Password: ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
- ✅ `confirmPassword` phải khớp với `password`

#### **Step 4: Click "Execute"**

#### **Step 5: Xem Response**

**✅ Success (201 Created):**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nguyenvana@example.com",
  "role": "CANDIDATE",
  "status": "PENDING_EMAIL_VERIFICATION",
  "message": "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
  "otpExpiresAt": "2025-11-19T10:15:00.000Z"
}
```

**❌ Error (409 Conflict):**

```json
{
  "statusCode": 409,
  "message": "Email này đã được sử dụng",
  "error": "Conflict"
}
```

**❌ Error (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

### **Example 2: Xác thực Email (Verify Email)**

#### **Step 1: Lấy OTP từ email**

- Check email đã đăng ký
- Copy mã OTP 6 số (ví dụ: `123456`)

#### **Step 2: Mở endpoint**

- `POST /api/auth/verify-email`
- Click "Try it out"

#### **Step 3: Điền thông tin**

```json
{
  "email": "nguyenvana@example.com",
  "otpCode": "123456"
}
```

#### **Step 4: Execute và xem Response**

**✅ Success (200 OK):**

```json
{
  "message": "Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.",
  "redirectUrl": "/candidate/profile",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nguyenvana@example.com",
  "status": "ACTIVE"
}
```

**❌ Error (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": "Mã OTP không đúng hoặc đã hết hạn",
  "error": "Bad Request"
}
```

---

### **Example 3: Đăng nhập (Login)**

#### **Step 1: Mở endpoint**

- `POST /api/auth/login`
- Click "Try it out"

#### **Step 2: Điền credentials**

```json
{
  "email": "nguyenvana@example.com",
  "password": "Password@123"
}
```

#### **Step 3: Execute**

**✅ Success (200 OK):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "nguyenvana@example.com",
    "role": "CANDIDATE",
    "status": "ACTIVE"
  },
  "redirectUrl": "/candidate/dashboard"
}
```

#### **Step 4: Copy Access Token**

- Copy giá trị `accessToken` (JWT token)
- Dùng cho các request yêu cầu authentication

---

### **Example 4: Sử dụng JWT Authentication**

Một số endpoints yêu cầu authentication (Bearer Token).

#### **Step 1: Authorize**

- Click nút **"Authorize"** 🔓 ở góc trên bên phải
- Popup hiện ra

#### **Step 2: Nhập Token**

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Hoặc chỉ cần paste token (không cần "Bearer"):**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Step 3: Click "Authorize"**

- Icon 🔓 chuyển thành 🔒
- Token sẽ tự động được thêm vào header của tất cả requests

#### **Step 4: Test Protected Endpoint**

Ví dụ: `GET /api/users/profile`

```
Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**✅ Success (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "nguyenvana@example.com",
  "role": "CANDIDATE",
  "fullName": "Nguyễn Văn A"
}
```

**❌ Error (401 Unauthorized):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

### **Example 5: Quên mật khẩu (Forgot Password)**

#### **Step 1: Request OTP**

`POST /api/auth/forgot-password`

```json
{
  "email": "nguyenvana@example.com"
}
```

**Response:**

```json
{
  "message": "Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra email.",
  "expiresAt": "2025-11-19T10:20:00.000Z"
}
```

#### **Step 2: Reset Password với OTP**

`POST /api/auth/reset-password`

```json
{
  "email": "nguyenvana@example.com",
  "otpCode": "654321",
  "newPassword": "NewPassword@456",
  "confirmNewPassword": "NewPassword@456"
}
```

**Response:**

```json
{
  "message": "Đổi mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới."
}
```

---

## 🎨 Các tính năng Swagger UI

### **1. Schemas Section**

- Scroll xuống cuối trang
- Xem tất cả **Data Models/DTOs**
- Example: `RegisterCandidateDto`, `LoginResponseDto`, etc.

### **2. Response Examples**

Mỗi endpoint hiển thị:

- ✅ **Example Value** - Request body mẫu
- ✅ **Schema** - Cấu trúc data types
- ✅ **Responses** - Các HTTP status codes có thể có

### **3. Curl Command**

Sau khi Execute, Swagger hiển thị:

```bash
curl -X 'POST' \
  'http://localhost:3000/api/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "nguyenvana@example.com",
  "password": "Password@123"
}'
```

Copy để test với curl hoặc Postman!

### **4. Request URL**

```
http://localhost:3000/api/auth/login
```

### **5. Server Response**

- **Code**: HTTP status (200, 400, 401, etc.)
- **Headers**: Response headers
- **Response body**: JSON response

---

## 🔧 Tips & Tricks

### **1. Persist Authorization**

Swagger tự động lưu JWT token trong session:

- ✅ Không cần nhập lại token sau mỗi refresh
- ✅ Token được thêm tự động vào tất cả protected requests

### **2. Test Multiple Scenarios**

**Valid Request:**

```json
{
  "email": "valid@example.com",
  "password": "ValidPass@123"
}
```

**Invalid Request (test validation):**

```json
{
  "email": "invalid-email",
  "password": "123"
}
```

### **3. Copy Response for Frontend**

- Copy JSON response làm mock data
- Copy schema để tạo TypeScript interfaces

### **4. Download OpenAPI Spec**

- URL: `http://localhost:3000/api/docs-json`
- Import vào Postman/Insomnia

---

## 📊 HTTP Status Codes

| Code    | Meaning               | Example                             |
| ------- | --------------------- | ----------------------------------- |
| **200** | OK                    | Login success, verify email success |
| **201** | Created               | Register success                    |
| **400** | Bad Request           | Validation error, invalid OTP       |
| **401** | Unauthorized          | Missing/invalid JWT token           |
| **404** | Not Found             | Email not found                     |
| **409** | Conflict              | Email already exists                |
| **500** | Internal Server Error | Database error                      |

---

## 🔍 Debugging với Swagger

### **1. Check Request Format**

Nếu lỗi validation:

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

→ Fix: Sửa email format và password length

### **2. Check Response**

- **Code 201**: Request thành công
- **Code 4xx**: Client error (check input)
- **Code 5xx**: Server error (check logs)

### **3. Check Server Logs**

Terminal output:

```
[Nest] 12345  - 11/19/2025, 10:00:00 AM     LOG [RoutesResolver] AuthController {/api/auth}:
[Nest] 12345  - 11/19/2025, 10:00:00 AM     LOG [RouterExplorer] Mapped {/api/auth/login, POST} route
```

---

## 🎯 Complete Testing Flow Example

### **Scenario: Complete User Registration to Login**

```
1. Register Candidate
   POST /api/auth/register/candidate
   → Get userId, check email for OTP

2. Verify Email
   POST /api/auth/verify-email
   → Account activated (status: ACTIVE)

3. Login
   POST /api/auth/login
   → Get JWT access token

4. Use Protected Endpoints
   Authorize with JWT
   GET /api/users/profile
   → Get user profile

5. Logout (Optional)
   POST /api/auth/logout
   → Clear session
```

---

## 🆚 Swagger vs Postman

| Feature               | Swagger UI               | Postman                        |
| --------------------- | ------------------------ | ------------------------------ |
| **Setup**             | Built-in, auto-generated | Manual import                  |
| **Documentation**     | Always up-to-date        | Can be outdated                |
| **Learning Curve**    | Easy                     | Moderate                       |
| **Advanced Features** | Basic testing            | Advanced (scripts, tests, env) |
| **Collaboration**     | Built-in docs            | Export/Import collections      |

**Recommendation:**

- ✅ Use **Swagger** for quick testing & exploration
- ✅ Use **Postman** for complex test scenarios & automation

---

## 🚀 Quick Commands

```bash
# Start server
npm run start:dev

# Open Swagger UI
# Browser: http://localhost:3000/api/docs

# Test endpoint flow:
# 1. Register → 2. Verify → 3. Login → 4. Test protected endpoints
```

---

## 📚 Additional Resources

- **Swagger Official**: https://swagger.io/tools/swagger-ui/
- **NestJS Swagger**: https://docs.nestjs.com/openapi/introduction
- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.0.0

---

## 🆘 Common Issues

### **Issue 1: Swagger page không load**

**Solution:**

```bash
# Check server đang chạy
# Check port 3000 không bị conflict
# Restart server: Ctrl+C và npm run start:dev
```

### **Issue 2: "Try it out" không hoạt động**

**Solution:**

```bash
# Check CORS settings
# Check browser console for errors
# Try different browser
```

### **Issue 3: JWT token expired**

**Solution:**

```bash
# Login lại để lấy token mới
# Click Authorize và paste token mới
```

---

## ✅ Best Practices

1. **Test validation** với invalid data trước
2. **Check response codes** để hiểu behavior
3. **Copy curl commands** để tái sử dụng
4. **Document bugs** tìm thấy qua Swagger
5. **Share Swagger URL** với team members

---

**🎉 Bạn đã sẵn sàng test API với Swagger!**

**Bắt đầu ngay:**

```bash
npm run start:dev
# Then open: http://localhost:3000/api/docs
```
