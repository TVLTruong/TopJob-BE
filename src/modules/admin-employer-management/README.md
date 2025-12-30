# Admin Employer Management Module

Module quản lý tài khoản nhà tuyển dụng cho Admin - Domain-driven design.

## 📋 Tổng quan

Module này xử lý quản lý toàn diện tài khoản employer, bao gồm:

- Xem danh sách và tìm kiếm employers
- Xem chi tiết thông tin employer + thống kê
- Cấm/mở cấm tài khoản
- Xóa tài khoản và dữ liệu liên quan

## 🎯 Use Cases

- **UCADM03**: Admin quản lý nhà tuyển dụng

## 🏗️ Cấu trúc

```
admin-employer-management/
├── dto/
│   ├── query-employer.dto.ts       # Query parameters
│   ├── employer-detail.dto.ts      # Detail response DTOs
│   ├── ban-employer.dto.ts         # Ban request DTO
│   └── index.ts
├── admin-employer-management.controller.ts  # REST API endpoints
├── admin-employer-management.service.ts     # Domain logic
├── admin-employer-management.module.ts      # Module definition
└── index.ts
```

## 🔐 Bảo mật

**Tất cả endpoints yêu cầu:**

- JWT Authentication (`JwtAuthGuard`)
- Role = ADMIN (`RolesGuard` + `@Roles(UserRole.ADMIN)`)

**Business Rules:**

- ✅ Admin không thể tự ban chính mình
- ✅ Admin không thể tự xóa chính mình
- ✅ Validate trạng thái hợp lệ trước mọi hành động

## 📡 API Endpoints

### 1. Lấy danh sách employers

```http
GET /admin/employers
```

**Query Parameters:**

- `page` (number, optional): Số trang (default: 1)
- `limit` (number, optional): Số bản ghi/trang (default: 10)
- `search` (string, optional): Tìm kiếm theo email, tên công ty, hoặc tên người liên hệ
- `status` (UserStatus, optional): Filter theo trạng thái user

**Response:**

```json
{
  "data": [
    {
      "id": "1",
      "email": "employer@example.com",
      "role": "employer",
      "status": "active",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "employer": {
        "id": "1",
        "fullName": "Nguyen Van A",
        "companyName": "ABC Corp",
        "logoUrl": "https://...",
        "status": "active"
      }
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

### 2. Xem chi tiết employer

```http
GET /admin/employers/:id
```

**Response:**

```json
{
  "user": {
    "id": "1",
    "email": "employer@example.com",
    "role": "employer",
    "status": "active",
    "isVerified": true,
    "emailVerifiedAt": "2024-01-01T10:00:00.000Z",
    "lastLoginAt": "2024-01-15T08:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T08:30:00.000Z"
  },
  "profile": {
    "id": "1",
    "fullName": "Nguyen Van A",
    "workTitle": "HR Manager",
    "companyName": "ABC Corp",
    "description": "Leading tech company...",
    "website": "https://abc.com",
    "logoUrl": "https://...",
    "coverImageUrl": "https://...",
    "foundedDate": 2010,
    "companySize": "medium",
    "contactEmail": "hr@abc.com",
    "contactPhone": "0123456789",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-10T00:00:00.000Z"
  },
  "jobStats": {
    "totalJobs": 25,
    "activeJobs": 10,
    "pendingJobs": 3,
    "rejectedJobs": 2
  }
}
```

### 3. Cấm tài khoản employer

```http
POST /admin/employers/:id/ban
```

**Request Body:**

```json
{
  "reason": "Vi phạm chính sách đăng tin tuyển dụng" // Required, min 10 chars
}
```

**Response:**

```json
{
  "message": "Đã cấm tài khoản nhà tuyển dụng thành công"
}
```

**Side Effects:**

- `user.status` → `BANNED`
- Tất cả jobs có status `ACTIVE` → `HIDDEN`

### 4. Mở cấm tài khoản employer

```http
POST /admin/employers/:id/unban
```

**Response:**

```json
{
  "message": "Đã mở cấm tài khoản nhà tuyển dụng thành công"
}
```

**Side Effects:**

- `user.status` → `ACTIVE`

### 5. Xóa tài khoản employer

```http
DELETE /admin/employers/:id
```

**Response:**

```json
{
  "message": "Đã xóa tài khoản nhà tuyển dụng và toàn bộ dữ liệu liên quan"
}
```

**Side Effects (Cascade Delete):**

- User record deleted
- Employer profile deleted
- All jobs deleted
- All applications deleted
- All employer locations deleted
- All pending edits deleted

## 🔄 Workflow Chi tiết

### Ban Employer

**Validation:**

- ✅ User tồn tại và có role = EMPLOYER
- ✅ User chưa bị banned trước đó
- ✅ Admin không tự ban chính mình

**Actions:**

1. Lock user record (pessimistic write)
2. Update `user.status = BANNED`
3. Update all `ACTIVE` jobs → `HIDDEN`
4. Log action
5. TODO: Send ban notification email

### Unban Employer

**Validation:**

- ✅ User tồn tại và có role = EMPLOYER
- ✅ User hiện tại có status = BANNED

**Actions:**

1. Lock user record
2. Update `user.status = ACTIVE`
3. Log action
4. TODO: Send unban notification email

**Note:** Jobs vẫn giữ status `HIDDEN`, employer cần tự re-publish

### Delete Employer

**Validation:**

- ✅ User tồn tại và có role = EMPLOYER
- ✅ Admin không tự xóa chính mình

**Actions:**

1. Lock user record
2. Delete user (cascade deletes all related data)
3. Log warning (permanent action)

**Cascaded Deletions:**

```typescript
User (onDelete: CASCADE)
├── Employer
│   ├── Jobs
│   │   └── Applications
│   ├── EmployerLocations
│   └── EmployerPendingEdits
└── OtpVerifications
```

## ⚙️ Kỹ thuật

### Domain-Driven Design

Service được thiết kế theo domain-driven principles:

```typescript
// Domain entities
User (Aggregate Root)
└── Employer (Entity)
    └── Jobs (Entity)

// Domain services
class AdminEmployerManagementService {
  // Query operations
  getEmployerList()
  getEmployerDetail()

  // Command operations
  banEmployer()
  unbanEmployer()
  deleteEmployer()

  // Domain helpers
  private getEmployerJobStats()
}
```

### Transaction Handling

Tất cả write operations sử dụng transactions:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // Lock record
  const user = await queryRunner.manager.findOne(User, {
    where: { id: userId },
    lock: { mode: 'pessimistic_write' },
  });

  // Validate business rules
  if (userId === adminId) {
    throw new ForbiddenException('Cannot ban self');
  }

  // Execute operations
  // ...

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### Search Implementation

Multi-field search với ILIKE cho tiếng Việt:

```typescript
queryBuilder.andWhere(
  '(user.email ILIKE :search OR employer.companyName ILIKE :search OR employer.fullName ILIKE :search)',
  { search: `%${search}%` },
);
```

### Statistics Aggregation

Parallel queries cho performance:

```typescript
const [totalJobs, activeJobs, pendingJobs, rejectedJobs] = await Promise.all([
  this.jobRepository.count({ where: { employerId } }),
  this.jobRepository.count({ where: { employerId, status: ACTIVE } }),
  this.jobRepository.count({ where: { employerId, status: PENDING } }),
  this.jobRepository.count({ where: { employerId, status: REJECTED } }),
]);
```

### Logging

Comprehensive logging cho audit trail:

```typescript
// Info level
this.logger.log(`Banned employer ${userId} by admin ${adminId}`);

// Warning level (destructive actions)
this.logger.warn(
  `Deleted employer ${userId} (${user.email}) by admin ${adminId}`,
);

// Error level
this.logger.error(
  `Failed to ban employer ${userId}: ${error.message}`,
  error.stack,
);
```

## 🗄️ Entities Liên quan

- **User**: Tài khoản đăng nhập
- **Employer**: Hồ sơ công ty
- **Job**: Tin tuyển dụng
- **Application**: Hồ sơ ứng tuyển
- **EmployerLocation**: Địa điểm làm việc
- **EmployerPendingEdit**: Chỉnh sửa chờ duyệt

## 🎨 DTOs

### QueryEmployerDto

- Extends `PaginationDto`
- Filters: `search`, `status`
- Search supports: email, company name, full name

### EmployerDetailResponseDto

- Composite DTO with:
  - `user`: User information
  - `profile`: Employer profile
  - `jobStats`: Job statistics

### BanEmployerDto

- `reason`: Required, 10-1000 chars
- Used for audit trail

## 📊 Business Rules

1. **Self-Protection**: Admin cannot ban/delete themselves
2. **Status Validation**: Check current status before updates
3. **Idempotency**: Cannot ban already banned users
4. **Cascade Awareness**: Deletions cascade to all related data
5. **Job Hiding**: Ban hides jobs, unban doesn't restore them

## 🔒 Security Considerations

1. **Pessimistic Locking**: Prevents race conditions
2. **Validation First**: Always validate before mutations
3. **Transaction Safety**: Atomic operations
4. **Audit Logging**: All actions logged
5. **Email Notifications**: TODO - inform affected users

## 📝 TODO

- [ ] Implement email notifications
  - [ ] Ban notification with reason
  - [ ] Unban notification
  - [ ] Account deletion warning
- [ ] Add soft delete option (instead of hard delete)
- [ ] Bulk ban/unban operations
- [ ] Export employer list to CSV
- [ ] Activity history timeline
- [ ] Restore deleted accounts (if soft delete implemented)
- [ ] Dashboard statistics

## 🧪 Testing

Test với Swagger UI tại: `/api/docs`

**Test Flow:**

1. Login as ADMIN
2. GET danh sách employers
3. GET chi tiết một employer
4. POST ban employer
5. Verify jobs are hidden
6. POST unban employer
7. DELETE employer (test account only!)

## 🔗 Related Modules

- **AdminEmployerApprovalModule**: Duyệt hồ sơ NTD mới
- **AdminJobApprovalModule**: Duyệt tin tuyển dụng
- **EmployersModule**: Employer self-management
- **JobsModule**: Job management

## 📚 Tham khảo

- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeORM Transactions](https://typeorm.io/transactions)
- [TypeORM Cascade Options](https://typeorm.io/relations#cascades)
- [NestJS Guards](https://docs.nestjs.com/guards)
