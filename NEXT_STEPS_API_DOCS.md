# API Documentation - Next Steps After Registration

## Tổng quan luồng "Next Steps" sau đăng ký

Sau khi user đăng ký thành công (UC-REG-01, UC-REG-02) và xác thực email (UC-REG-03), frontend sẽ điều hướng user qua các bước hoàn thiện hồ sơ.

### Luồng trạng thái User Status:

```
PENDING_EMAIL_VERIFICATION → [Xác thực email]
    ↓
PENDING_PROFILE_COMPLETION → [Hoàn thiện hồ sơ]
    ↓
(Candidate) → ACTIVE
(Employer) → PENDING_APPROVAL → [Admin duyệt] → ACTIVE
```

---

## 1. User APIs (`/api/users`)

### GET /api/users/me

**Mô tả:** Lấy thông tin tài khoản của user đang đăng nhập
**Auth:** Bearer Token
**Response:**

```json
{
  "id": "1",
  "email": "user@example.com",
  "role": "candidate",
  "status": "pending_profile_completion",
  "isVerified": true,
  "emailVerifiedAt": "2024-01-15T10:00:00Z",
  "lastLoginAt": "2024-01-15T12:00:00Z",
  "profileId": "1",
  "fullName": "Nguyễn Văn A",
  "hasCompleteProfile": false,
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T12:00:00Z"
}
```

### GET /api/users/me/profile-status

**Mô tả:** Kiểm tra trạng thái hoàn thiện hồ sơ và bước tiếp theo
**Auth:** Bearer Token
**Response:**

```json
{
  "isComplete": false,
  "missingFields": ["phoneNumber", "addressCity", "cv"],
  "nextStep": "Hoàn thiện thông tin cá nhân và tải lên CV"
}
```

### PUT /api/users/me/password

**Mô tả:** Đổi mật khẩu
**Auth:** Bearer Token
**Request Body:**

```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

---

## 2. Candidate APIs (`/api/candidates`)

### GET /api/candidates/me

**Mô tả:** Lấy hồ sơ ứng viên của tôi
**Auth:** Bearer Token (role: candidate)
**Response:** CandidateProfileResponseDto

### PUT /api/candidates/me

**Mô tả:** Cập nhật hồ sơ ứng viên (Next Step chính)
**Auth:** Bearer Token (role: candidate)
**Request Body:**

```json
{
  "fullName": "Nguyễn Văn A",
  "gender": "male",
  "dateOfBirth": "1995-01-15",
  "phoneNumber": "0912345678",
  "avatarUrl": "https://cloudinary.com/avatar.jpg",
  "bio": "Tôi là một lập trình viên với 3 năm kinh nghiệm...",
  "personalUrl": "https://portfolio.example.com",
  "addressStreet": "123 Nguyễn Huệ",
  "addressDistrict": "Quận 1",
  "addressCity": "TP. Hồ Chí Minh",
  "addressCountry": "Vietnam",
  "experienceYears": 3,
  "experienceLevel": "junior",
  "educationLevel": "bachelor_degree"
}
```

### POST /api/candidates/me/cvs

**Mô tả:** Thêm CV mới (sau khi upload file lên cloud storage)
**Auth:** Bearer Token (role: candidate)
**Request Body:**

```json
{
  "fileName": "my-resume.pdf",
  "fileUrl": "https://cloudinary.com/abc123/my-resume.pdf",
  "fileSize": 1024000,
  "isDefault": true
}
```

### GET /api/candidates/me/cvs

**Mô tả:** Lấy danh sách CV của tôi
**Auth:** Bearer Token (role: candidate)

### PUT /api/candidates/me/cvs/default

**Mô tả:** Đặt CV mặc định
**Auth:** Bearer Token (role: candidate)
**Request Body:**

```json
{
  "cvId": "1"
}
```

### DELETE /api/candidates/me/cvs/:cvId

**Mô tả:** Xóa CV
**Auth:** Bearer Token (role: candidate)

### GET /api/candidates/:id

**Mô tả:** Xem hồ sơ ứng viên (public)
**Auth:** Bearer Token (bất kỳ role)

---

## 3. Employer APIs (`/api/employers`)

### GET /api/employers/me

**Mô tả:** Lấy hồ sơ nhà tuyển dụng của tôi
**Auth:** Bearer Token (role: employer)
**Response:** EmployerProfileResponseDto

### PUT /api/employers/me

**Mô tả:** Cập nhật hồ sơ nhà tuyển dụng (Next Step chính)
**Auth:** Bearer Token (role: employer)
**Request Body:**

```json
{
  "fullName": "Nguyễn Văn B",
  "workTitle": "Giám đốc Nhân sự",
  "companyName": "Công ty TNHH ABC",
  "description": "Công ty chúng tôi là một trong những công ty hàng đầu...",
  "website": "https://company.com",
  "logoUrl": "https://cloudinary.com/logo.png",
  "coverImageUrl": "https://cloudinary.com/cover.jpg",
  "foundedYear": 2010,
  "companySize": "medium",
  "contactEmail": "hr@company.com",
  "contactPhone": "028-1234-5678",
  "linkedlnUrl": "https://linkedin.com/company/abc",
  "facebookUrl": "https://facebook.com/abc",
  "xUrl": "https://x.com/abc",
  "benefits": ["Bảo hiểm sức khỏe", "Thưởng tháng 13", "Du lịch hàng năm"],
  "locations": [
    {
      "isHeadquarters": true,
      "province": "TP. Hồ Chí Minh",
      "district": "Quận 1",
      "detailedAddress": "123 Nguyễn Huệ, Phường Bến Nghé"
    }
  ]
}
```

### POST /api/employers/me/locations

**Mô tả:** Thêm địa điểm văn phòng mới
**Auth:** Bearer Token (role: employer)
**Request Body:**

```json
{
  "isHeadquarters": false,
  "province": "Hà Nội",
  "district": "Quận Cầu Giấy",
  "detailedAddress": "456 Duy Tân"
}
```

### GET /api/employers/me/locations

**Mô tả:** Lấy danh sách địa điểm văn phòng
**Auth:** Bearer Token (role: employer)

### PUT /api/employers/me/locations/:locationId/headquarters

**Mô tả:** Đặt trụ sở chính
**Auth:** Bearer Token (role: employer)

### DELETE /api/employers/me/locations/:locationId

**Mô tả:** Xóa địa điểm
**Auth:** Bearer Token (role: employer)

### GET /api/employers/:id

**Mô tả:** Xem hồ sơ công ty (public)
**Auth:** Bearer Token (bất kỳ role)

---

## Hướng dẫn Frontend Integration

### Sau đăng ký & xác thực email:

1. **Gọi GET /api/users/me** để lấy thông tin user và kiểm tra status
2. **Gọi GET /api/users/me/profile-status** để biết các trường còn thiếu
3. **Dựa vào role:**
   - **Candidate:** Điều hướng đến form hoàn thiện hồ sơ ứng viên
   - **Employer:** Điều hướng đến form hoàn thiện hồ sơ công ty

### Flow cho Candidate:

```
Step 1: Thông tin cá nhân
  → PUT /api/candidates/me (fullName, gender, dateOfBirth, phoneNumber, address...)

Step 2: Kinh nghiệm & Học vấn
  → PUT /api/candidates/me (experienceYears, experienceLevel, educationLevel, bio)

Step 3: Upload CV
  → Upload file lên Cloudinary
  → POST /api/candidates/me/cvs (với fileUrl từ Cloudinary)

Step 4: Hoàn tất
  → GET /api/users/me/profile-status để confirm isComplete: true
  → User status sẽ tự động chuyển sang ACTIVE
```

### Flow cho Employer:

```
Step 1: Thông tin công ty
  → PUT /api/employers/me (companyName, description, website, foundedYear...)

Step 2: Upload Logo/Cover
  → Upload files lên Cloudinary
  → PUT /api/employers/me (logoUrl, coverImageUrl)

Step 3: Địa điểm văn phòng
  → POST /api/employers/me/locations

Step 4: Thông tin liên hệ & Phúc lợi
  → PUT /api/employers/me (contactPhone, contactEmail, benefits)

Step 5: Hoàn tất
  → GET /api/users/me/profile-status để confirm isComplete: true
  → User status sẽ chuyển sang PENDING_APPROVAL (chờ admin duyệt)
```

---

## Enums Reference

### UserStatus

- `pending_email_verification` - Chờ xác thực email
- `pending_profile_completion` - Chờ hoàn thiện hồ sơ
- `pending_approval` - Chờ duyệt (NTD only)
- `active` - Đang hoạt động
- `banned` - Đã khóa

### Gender

- `male` - Nam
- `female` - Nữ
- `other` - Khác

### ExperienceLevel

- `intern` - Thực tập sinh
- `fresher` - Mới ra trường (0-1 năm)
- `junior` - Junior (1-3 năm)
- `middle` - Middle (3-5 năm)
- `senior` - Senior (5+ năm)
- `lead` - Team Lead
- `manager` - Manager

### EducationLevel

- `high_school` - Trung học phổ thông
- `associate_degree` - Cao đẳng
- `bachelor_degree` - Đại học
- `master_degree` - Thạc sĩ
- `doctoral_degree` - Tiến sĩ
- `other` - Khác

### CompanySize

- `startup` - 1-10 nhân viên
- `small` - 11-50 nhân viên
- `medium` - 51-200 nhân viên
- `large` - 201-1000 nhân viên
- `enterprise` - Hơn 1000 nhân viên

### EmployerStatus

- `pending_approval` - Chờ admin duyệt
- `active` - Đã duyệt, hoạt động
- `banned` - Bị khóa
