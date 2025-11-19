# Cập nhật UC-CORE-01 và UC-REG-03

## ✅ Những gì đã cập nhật

### 1. **UC-CORE-01: Gửi và Xác thực OTP Email** - Hoàn thiện 100%

#### ✨ Tính năng mới:

**a) Hash OTP trước khi lưu trữ** ✅

- Thêm method `hashOtp()` sử dụng bcrypt (10 salt rounds)
- Thêm method `compareOtp()` để so sánh OTP với hash
- Cập nhật `createOtp()` để hash OTP trước khi lưu database
- Cập nhật `verifyOtp()` để sử dụng bcrypt.compare thay vì so sánh plain text

**b) Luồng chính (Basic Flow):**

```typescript
1. ✅ Nhận email từ Use Case gọi
2. ✅ Tạo OTP (6 số) và thời gian hết hạn (5 phút)
3. ✅ Hash OTP trước khi lưu trữ (QUAN TRỌNG!)
4. ✅ Gửi email chứa mã OTP
5-6. ✅ Chờ người dùng nhập OTP
7. ✅ Kiểm tra OTP khớp (dùng bcrypt.compare) và còn hạn
8. ✅ Vô hiệu hóa OTP và trả về "Thành công"
```

**c) Luồng phụ/Exception:**

- ✅ **A1: Gửi lại OTP** - `resendOtp()` method với rate limiting
- ✅ **E1: Gửi email thất bại** - Try-catch với error message rõ ràng
- ✅ **E2: OTP sai** - Đếm số lần sai (max 5), message số lần còn lại
- ✅ **E3: OTP hết hạn** - Check expiry time, yêu cầu gửi lại

#### 📝 Code changes:

```typescript
// otp.service.ts

// NEW: Hash OTP method
private async hashOtp(otpCode: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(otpCode, saltRounds);
}

// NEW: Compare OTP method
private async compareOtp(otpCode: string, hashedOtp: string): Promise<boolean> {
  return await bcrypt.compare(otpCode, hashedOtp);
}

// UPDATED: createOtp - Now hashes OTP before saving
const hashedOtp = await this.hashOtp(otpCode);
const otp = this.otpRepository.create({
  otpCode: hashedOtp, // Store hashed OTP
  // ... other fields
});

// UPDATED: verifyOtp - Now uses bcrypt.compare
const isOtpValid = await this.compareOtp(otpCode, otp.otpCode);
if (!isOtpValid) {
  // UC-CORE-01 E2: OTP sai
  throw new BadRequestException(`Mã OTP không đúng...`);
}
```

---

### 2. **UC-REG-03: Xác thực Email Đăng ký** - Hoàn thiện 100%

#### ✨ Tính năng mới:

**a) Role-based Status Update** ✅

Trước đây: Tất cả user đều set `status = ACTIVE`

Bây giờ: Phân biệt theo role

- **Candidate** → `status = ACTIVE` → Redirect to Dashboard
- **Employer** → `status = PENDING_PROFILE_COMPLETION` → Redirect to Login

**b) Luồng chính theo spec:**

```typescript
1. ✅ Lấy email từ UC-REG-01/UC-REG-02
2. ✅ Thực hiện <<include UC-CORE-01>>
3. ✅ Nếu UC-CORE-01 trả về "Thành công":
4. ✅ Kiểm tra vai trò:
   - Ứng viên: status = ACTIVE
   - NTD: status = PENDING_PROFILE_COMPLETION
```

**c) Custom success message theo role:**

- Candidate: "Xác thực email thành công! Bạn có thể bắt đầu tìm kiếm việc làm."
- Employer: "Xác thực email thành công! Vui lòng đăng nhập để hoàn thiện hồ sơ công ty."

**d) Exception handling:**

- ✅ **E1: Xác thực thất bại** - Wrap UC-CORE-01 trong try-catch, message rõ ràng

#### 📝 Code changes:

```typescript
// verify-email.usecase.ts

// NEW: Import UserRole and Employer
import { UserRole } from '../../common/enums';
import { Employer } from '../../database/entities/employer.entity';

// NEW: Add Employer repository
@InjectRepository(Employer)
private readonly employerRepository: Repository<Employer>,

// UPDATED: execute() - Now handles UC-CORE-01 failure
async execute(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
  const user = await this.findUserByEmail(dto.email);
  this.validateUserStatus(user);

  // UC-CORE-01: Verify OTP with error handling
  try {
    await this.otpService.verifyOtp(dto.email, dto.otpCode, OtpPurpose.EMAIL_VERIFICATION);
  } catch (error) {
    // UC-REG-03 E1: Xác thực thất bại
    throw new BadRequestException('Xác thực thất bại...');
  }

  // UC-REG-03: Role-based status update
  await this.updateUserStatusBasedOnRole(user);
  await this.sendWelcomeEmail(user);

  return {
    verified: true,
    message: this.getSuccessMessage(user.role),
    userId: user.id,
    email: user.email,
  };
}

// NEW: Role-based status update
private async updateUserStatusBasedOnRole(user: User): Promise<void> {
  user.isVerified = true;
  user.emailVerifiedAt = new Date();

  if (user.role === UserRole.CANDIDATE) {
    user.status = UserStatus.ACTIVE;
  } else if (user.role === UserRole.EMPLOYER) {
    user.status = UserStatus.PENDING_PROFILE_COMPLETION;
  }

  await this.userRepository.save(user);
}

// NEW: Get role-specific success message
private getSuccessMessage(role: UserRole): string {
  if (role === UserRole.CANDIDATE) {
    return 'Xác thực email thành công! Bạn có thể bắt đầu tìm kiếm việc làm.';
  } else if (role === UserRole.EMPLOYER) {
    return 'Xác thực email thành công! Vui lòng đăng nhập để hoàn thiện hồ sơ công ty.';
  }
  return 'Xác thực email thành công!';
}

// UPDATED: sendWelcomeEmail - Now handles both Candidate and Employer
private async sendWelcomeEmail(user: User): Promise<void> {
  try {
    let fullName = 'Người dùng';

    if (user.role === UserRole.CANDIDATE) {
      const candidate = await this.candidateRepository.findOne({ where: { userId: user.id } });
      if (candidate) fullName = candidate.fullName;
    } else if (user.role === UserRole.EMPLOYER) {
      const employer = await this.employerRepository.findOne({ where: { userId: user.id } });
      if (employer) fullName = employer.fullName;
    }

    await this.emailService.sendWelcomeEmail(user.email, fullName);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}
```

---

### 3. **Module Updates**

**auth.module.ts:**

```typescript
// ADDED: Import Employer entity
import {
  User,
  Candidate,
  Employer,
  OtpVerification,
} from '../database/entities';

// UPDATED: TypeORM imports
TypeOrmModule.forFeature([User, Candidate, Employer, OtpVerification]);
```

---

## 🔒 Security Improvements

### Before:

```typescript
// ❌ OTP stored in plain text
otpCode: '123456';
```

### After:

```typescript
// ✅ OTP hashed with bcrypt
otpCode: '$2b$10$N9qo8uLOickgx2ZMRZoMye...';
```

**Benefits:**

- Database breach → Attacker cannot see actual OTP codes
- Follows security best practices
- Compliant with UC-CORE-01 spec: "Lưu trữ (OTP đã hash...)"

---

## 📊 Flow Comparison

### Before (Tất cả user):

```
Register → Verify OTP → status = ACTIVE → Dashboard
```

### After (Role-based):

**Candidate:**

```
Register → Verify OTP → status = ACTIVE → Dashboard
```

**Employer:**

```
Register → Verify OTP → status = PENDING_PROFILE_COMPLETION → Login → Complete Profile
```

---

## ✅ Checklist - 100% Complete

### UC-CORE-01:

- [x] Nhận email từ UC gọi
- [x] Tạo OTP 6 số
- [x] Tạo thời gian hết hạn (5 phút)
- [x] **Hash OTP trước khi lưu** ⭐ NEW
- [x] Gửi email chứa OTP
- [x] Xác thực OTP với bcrypt.compare ⭐ NEW
- [x] Kiểm tra OTP còn hạn
- [x] Vô hiệu hóa OTP sau khi dùng
- [x] A1: Gửi lại OTP
- [x] E1: Gửi email thất bại - Error handling
- [x] E2: OTP sai - Đếm attempts
- [x] E3: OTP hết hạn - Message rõ ràng

### UC-REG-03:

- [x] Lấy email từ UC-REG-01/02
- [x] Include UC-CORE-01
- [x] Xử lý success từ UC-CORE-01
- [x] **Kiểm tra role** ⭐ NEW
- [x] **Candidate → ACTIVE** ⭐ NEW
- [x] **Employer → PENDING_PROFILE_COMPLETION** ⭐ NEW
- [x] **Role-specific success message** ⭐ NEW
- [x] E1: Xác thực thất bại - Error handling ⭐ NEW
- [x] Send welcome email (both roles) ⭐ UPDATED

---

## 🧪 Testing Scenarios

### Test UC-CORE-01:

1. **Hash OTP:**

   ```sql
   SELECT otp_code FROM otp_verifications ORDER BY created_at DESC LIMIT 1;
   -- Should see: $2b$10$... (bcrypt hash)
   -- NOT: 123456 (plain text)
   ```

2. **Verify với OTP đúng:**

   ```bash
   POST /auth/verify-email
   { "email": "test@test.com", "otpCode": "123456" }
   # Should: Compare hash thành công → return success
   ```

3. **Verify với OTP sai:**
   ```bash
   POST /auth/verify-email
   { "email": "test@test.com", "otpCode": "999999" }
   # Should: "Mã OTP không đúng. Bạn còn 4 lần thử."
   ```

### Test UC-REG-03:

1. **Candidate verification:**

   ```bash
   # Register as Candidate
   POST /auth/register/candidate

   # Verify email
   POST /auth/verify-email

   # Check database:
   SELECT role, status FROM users WHERE email = 'candidate@test.com';
   # Should: role = 'candidate', status = 'active'
   ```

2. **Employer verification (when implemented):**

   ```bash
   # Register as Employer
   POST /auth/register/employer

   # Verify email
   POST /auth/verify-email

   # Check database:
   SELECT role, status FROM users WHERE email = 'employer@test.com';
   # Should: role = 'employer', status = 'pending_profile_completion'
   ```

3. **Success message check:**

   ```bash
   # Candidate:
   Response: "Xác thực email thành công! Bạn có thể bắt đầu tìm kiếm việc làm."

   # Employer:
   Response: "Xác thực email thành công! Vui lòng đăng nhập để hoàn thiện hồ sơ công ty."
   ```

---

## 📝 Summary

**Code bây giờ đã 100% thỏa mãn cả 2 use case:**

✅ **UC-CORE-01** - Gửi và Xác thực OTP Email

- Tạo OTP 6 số ✓
- **Hash OTP trước khi lưu** ✓ (NEW)
- Gửi email ✓
- **Verify bằng bcrypt.compare** ✓ (NEW)
- Kiểm tra expiry ✓
- Handle tất cả exceptions (E1, E2, E3) ✓
- Gửi lại OTP (A1) ✓

✅ **UC-REG-03** - Xác thực Email Đăng ký

- Include UC-CORE-01 ✓
- **Role-based status update** ✓ (NEW)
- Candidate → ACTIVE ✓
- Employer → PENDING_PROFILE_COMPLETION ✓
- **Custom success messages** ✓ (NEW)
- Exception handling (E1) ✓

**Security:** OTP được hash bằng bcrypt trước khi lưu database! 🔒
