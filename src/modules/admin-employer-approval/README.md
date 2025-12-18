# Admin Employer Approval Module

Module quản lý duyệt hồ sơ nhà tuyển dụng cho Admin.

## 📋 Tổng quan

Module này xử lý workflow phê duyệt hồ sơ nhà tuyển dụng, bao gồm:

- Duyệt hồ sơ đăng ký mới
- Duyệt/từ chối chỉnh sửa hồ sơ
- Ghi nhận lịch sử phê duyệt

## 🎯 Use Cases

- **UCADM01**: Admin duyệt hồ sơ NTD mới
- **UCEMP02**: Admin duyệt chỉnh sửa hồ sơ NTD

## 🏗️ Cấu trúc

```
admin-employer-approval/
├── dto/
│   ├── query-employer.dto.ts        # Query parameters cho danh sách
│   ├── employer-detail.dto.ts       # Response DTO cho chi tiết
│   ├── approve-employer.dto.ts      # Request DTO cho duyệt
│   ├── reject-employer.dto.ts       # Request DTO cho từ chối
│   └── index.ts
├── admin-employer-approval.controller.ts  # REST API endpoints
├── admin-employer-approval.service.ts     # Business logic
├── admin-employer-approval.module.ts      # Module definition
└── index.ts
```

## 🔐 Bảo mật

**Tất cả endpoints yêu cầu:**

- JWT Authentication (`JwtAuthGuard`)
- Role = ADMIN (`RolesGuard` + `@Roles(UserRole.ADMIN)`)

## 📡 API Endpoints

### 1. Lấy danh sách NTD chờ duyệt

```http
GET /admin/employer-approval
```

**Query Parameters:**

- `page` (number, optional): Số trang (default: 1)
- `limit` (number, optional): Số bản ghi/trang (default: 10)
- `status` (EmployerStatus, optional): Filter theo trạng thái employer
- `profileStatus` (EmployerProfileStatus, optional): Filter theo trạng thái profile

**Response:**

```json
{
  "data": [
    {
      "id": "1",
      "companyName": "ABC Corp",
      "status": "pending_approval",
      "profileStatus": "approved",
      "user": {
        "email": "employer@example.com",
        "status": "pending_approval"
      },
      "pendingEdits": []
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 2. Xem chi tiết NTD

```http
GET /admin/employer-approval/:id
```

**Response:**

```json
{
  "user": {
    "id": "1",
    "email": "employer@example.com",
    "role": "employer",
    "status": "pending_approval",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "employer": {
    "id": "1",
    "fullName": "Nguyen Van A",
    "companyName": "ABC Corp",
    "description": "Company description",
    "status": "pending_approval",
    "profileStatus": "approved"
  },
  "pendingEdits": [
    {
      "fieldName": "companyName",
      "fieldLabel": "Tên công ty",
      "oldValue": "ABC Corp",
      "newValue": "ABC Corporation",
      "createdAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "hasPendingEdits": true
}
```

### 3. Duyệt hồ sơ

```http
POST /admin/employer-approval/:id/approve
```

**Request Body:**

```json
{
  "note": "Hồ sơ đầy đủ và hợp lệ" // Optional
}
```

**Response:**

```json
{
  "message": "Đã duyệt hồ sơ nhà tuyển dụng mới",
  "employer": {
    "id": "1",
    "status": "active",
    "profileStatus": "approved"
  }
}
```

### 4. Từ chối hồ sơ

```http
POST /admin/employer-approval/:id/reject
```

**Request Body:**

```json
{
  "reason": "Thông tin công ty không chính xác" // Required, min 10 chars
}
```

**Response:**

```json
{
  "message": "Đã từ chối hồ sơ nhà tuyển dụng"
}
```

## 🔄 Workflow Chi tiết

### Duyệt Hồ sơ Mới

**Before:**

- `user.status` = `PENDING_APPROVAL`
- `employer.status` = `PENDING_APPROVAL`

**After Approve:**

- `user.status` = `ACTIVE`
- `employer.status` = `ACTIVE`
- `employer.isApproved` = `true`
- Tạo `ApprovalLog` với action = `APPROVED`

**After Reject:**

- `user.status` = `PENDING_PROFILE_COMPLETION`
- `employer.status` giữ nguyên
- Tạo `ApprovalLog` với action = `REJECTED`
- TODO: Gửi email thông báo từ chối

### Duyệt Chỉnh sửa Hồ sơ

**Before:**

- `employer.profileStatus` = `PENDING_EDIT_APPROVAL`
- Có bản ghi trong `employer_pending_edits`

**After Approve:**

- Apply các thay đổi từ `pending_edits` vào `employer`
- Xóa tất cả `pending_edits`
- `employer.profileStatus` = `APPROVED`
- Tạo `ApprovalLog`

**After Reject:**

- Xóa tất cả `pending_edits` (giữ hồ sơ cũ)
- `employer.profileStatus` = `APPROVED`
- Tạo `ApprovalLog`
- TODO: Gửi email thông báo từ chối

## ⚙️ Kỹ thuật

### Transaction Handling

Tất cả approve/reject operations đều sử dụng **database transaction** để đảm bảo:

- Data consistency
- Atomicity (all or nothing)
- Pessimistic locking (`pessimistic_write`) khi đọc employer

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // Lock employer record
  const employer = await queryRunner.manager.findOne(Employer, {
    where: { id: employerId },
    lock: { mode: 'pessimistic_write' },
  });

  // Perform operations...

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### Validation

**Status Validation:**

- Kiểm tra trạng thái hiện tại trước khi xử lý
- Throw `BadRequestException` nếu trạng thái không hợp lệ

**Required Fields:**

- Từ chối: Bắt buộc có `reason` (min 10, max 1000 chars)

### Logging

Service ghi nhận tất cả các hành động quan trọng:

```typescript
this.logger.log(
  `Approved new employer profile: ${employerId} by admin: ${adminId}`,
);
this.logger.error(`Failed to approve employer ${employerId}: ${error.message}`);
```

## 🗄️ Entities Liên quan

- **User**: Thông tin đăng nhập và trạng thái user
- **Employer**: Hồ sơ công ty
- **EmployerPendingEdit**: Các trường đang chờ duyệt
- **ApprovalLog**: Lịch sử phê duyệt

## 🎨 DTOs

### QueryEmployerDto

- Extends `PaginationDto`
- Filters: `status`, `profileStatus`

### EmployerDetailDto

- Kết hợp: User + Employer + PendingEdits
- Sử dụng `class-transformer` với `@Expose()` để control serialization

### ApproveEmployerDto

- `note`: Optional, max 500 chars

### RejectEmployerDto

- `reason`: Required, 10-1000 chars

## 📝 TODO

- [ ] Tích hợp MailService để gửi email thông báo từ chối
- [ ] Thêm notification cho employer khi được duyệt/từ chối
- [ ] Thêm bulk approval/rejection
- [ ] Export danh sách NTD chờ duyệt

## 🧪 Testing

Test với Swagger UI tại: `/api/docs`

**Test Flow:**

1. Login as ADMIN
2. GET danh sách employers pending
3. GET chi tiết một employer
4. POST approve hoặc reject

## 📚 Tham khảo

- [NestJS Guards](https://docs.nestjs.com/guards)
- [TypeORM Transactions](https://typeorm.io/transactions)
- [Class Transformer](https://github.com/typestack/class-transformer)
