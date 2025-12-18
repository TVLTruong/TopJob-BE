# Admin Job Approval Module

Module quản lý duyệt tin tuyển dụng cho Admin.

## 📋 Tổng quan

Module này xử lý workflow phê duyệt tin tuyển dụng, bao gồm:

- Xem danh sách tin tuyển dụng chờ duyệt
- Xem chi tiết tin tuyển dụng
- Phê duyệt tin tuyển dụng (chuyển sang ACTIVE)
- Từ chối tin tuyển dụng (chuyển sang REJECTED)
- Ghi log audit cho mọi quyết định

## 🎯 Use Cases

- **UCADM02**: Admin duyệt tin tuyển dụng

## 🏗️ Cấu trúc

```
admin-job-approval/
├── dto/
│   ├── query-job.dto.ts         # Query parameters cho danh sách
│   ├── job-detail.dto.ts        # Response DTO cho chi tiết
│   ├── approve-job.dto.ts       # Request DTO cho duyệt
│   ├── reject-job.dto.ts        # Request DTO cho từ chối
│   └── index.ts
├── admin-job-approval.controller.ts  # REST API endpoints
├── admin-job-approval.service.ts     # Business logic
├── admin-job-approval.module.ts      # Module definition
└── index.ts
```

## 🔐 Bảo mật

**Tất cả endpoints yêu cầu:**

- JWT Authentication (`JwtAuthGuard`)
- Role = ADMIN (`RolesGuard` + `@Roles(UserRole.ADMIN)`)

## 📡 API Endpoints

### 1. Lấy danh sách tin tuyển dụng chờ duyệt

```http
GET /admin/job-approval
```

**Query Parameters:**

- `page` (number, optional): Số trang (default: 1)
- `limit` (number, optional): Số bản ghi/trang (default: 10)
- `search` (string, optional): Tìm kiếm theo tên công việc
- `categoryId` (string, optional): Filter theo category
- `employerId` (string, optional): Filter theo employer

**Response:**

```json
{
  "data": [
    {
      "id": "1",
      "title": "Senior Backend Developer",
      "slug": "senior-backend-developer-abc-corp",
      "status": "pending_approval",
      "employer": {
        "id": "1",
        "companyName": "ABC Corp",
        "logoUrl": "https://..."
      },
      "category": {
        "id": "1",
        "name": "IT - Phần mềm",
        "slug": "it-phan-mem"
      },
      "location": {
        "id": "1",
        "city": "Hồ Chí Minh",
        "address": "123 Nguyễn Văn Linh"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
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

### 2. Xem chi tiết tin tuyển dụng

```http
GET /admin/job-approval/:id
```

**Response:**

```json
{
  "id": "1",
  "title": "Senior Backend Developer",
  "slug": "senior-backend-developer-abc-corp",
  "description": "We are looking for...",
  "requirements": "- 3+ years experience...",
  "responsibilities": "- Design and develop...",
  "niceToHave": "- AWS experience...",
  "salaryMin": 20000000,
  "salaryMax": 30000000,
  "isNegotiable": false,
  "jobType": "full_time",
  "experienceLevel": "mid_level",
  "positionsAvailable": 2,
  "requiredSkills": ["NestJS", "TypeScript", "PostgreSQL"],
  "status": "pending_approval",
  "deadline": "2024-12-31T23:59:59.000Z",
  "publishedAt": null,
  "applicationCount": 0,
  "viewCount": 0,
  "isFeatured": false,
  "isUrgent": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "employer": {
    "id": "1",
    "companyName": "ABC Corp",
    "logoUrl": "https://...",
    "contactEmail": "hr@abc.com"
  },
  "category": {
    "id": "1",
    "name": "IT - Phần mềm",
    "slug": "it-phan-mem"
  },
  "location": {
    "id": "1",
    "address": "123 Nguyễn Văn Linh",
    "city": "Hồ Chí Minh",
    "isHeadquarters": true
  }
}
```

### 3. Duyệt tin tuyển dụng

```http
POST /admin/job-approval/:id/approve
```

**Request Body:**

```json
{
  "note": "Tin tuyển dụng phù hợp" // Optional
}
```

**Response:**

```json
{
  "message": "Đã duyệt tin tuyển dụng thành công",
  "job": {
    "id": "1",
    "status": "active",
    "publishedAt": "2024-01-02T10:00:00.000Z"
  }
}
```

### 4. Từ chối tin tuyển dụng

```http
POST /admin/job-approval/:id/reject
```

**Request Body:**

```json
{
  "reason": "Nội dung công việc không rõ ràng" // Required, min 10 chars
}
```

**Response:**

```json
{
  "message": "Đã từ chối tin tuyển dụng"
}
```

## 🔄 Workflow Chi tiết

### Phê duyệt Tin tuyển dụng

**Before:**

- `job.status` = `PENDING_APPROVAL`
- `job.publishedAt` = `null`

**After Approve:**

- `job.status` = `ACTIVE`
- `job.publishedAt` = Current timestamp
- Tin hiển thị cho candidates
- Tạo `ApprovalLog` với action = `APPROVED`

**After Reject:**

- `job.status` = `REJECTED`
- Tin KHÔNG hiển thị cho candidates
- Tạo `ApprovalLog` với action = `REJECTED` và reason
- TODO: Gửi email thông báo cho employer

### Validation Rules

**Chỉ cho phép approve/reject khi:**

- Job tồn tại
- `job.status` = `PENDING_APPROVAL`

**Không cho phép:**

- Duyệt lại job đã ACTIVE
- Duyệt lại job đã REJECTED
- Từ chối không có lý do (min 10 chars, max 1000 chars)

## ⚙️ Kỹ thuật

### Transaction Handling

Tất cả approve/reject operations sử dụng **database transaction**:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // Lock job record
  const job = await queryRunner.manager.findOne(Job, {
    where: { id: jobId },
    lock: { mode: 'pessimistic_write' },
  });

  // Validate status
  if (job.status !== JobStatus.PENDING_APPROVAL) {
    throw new BadRequestException('...');
  }

  // Update job + Create audit log

  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### Status Validation

Service validate trạng thái hiện tại và throw exception rõ ràng:

```typescript
if (job.status !== JobStatus.PENDING_APPROVAL) {
  throw new BadRequestException(
    `Không thể duyệt tin tuyển dụng. Trạng thái hiện tại: ${job.status}. ` +
      `Chỉ có thể duyệt tin có trạng thái PENDING_APPROVAL.`,
  );
}
```

### Audit Logging

Mọi quyết định được ghi vào `approval_logs`:

```typescript
const approvalLog = {
  adminId: string,
  targetType: ApprovalTargetType.JOB_POST,
  targetId: jobId,
  action: ApprovalAction.APPROVED | REJECTED,
  reason: string | null,
  createdAt: Date,
};
```

### Logging

```typescript
this.logger.log(`Approved job post: ${jobId} by admin: ${adminId}`);
this.logger.error(`Failed to approve job ${jobId}: ${error.message}`);
```

## 🗄️ Entities Liên quan

- **Job**: Thông tin tin tuyển dụng
- **Employer**: Nhà tuyển dụng đăng tin
- **JobCategory**: Ngành nghề
- **EmployerLocation**: Địa điểm làm việc
- **ApprovalLog**: Lịch sử phê duyệt

## 🎨 DTOs

### QueryJobDto

- Extends `PaginationDto`
- Filters: `search`, `categoryId`, `employerId`
- Search sử dụng ILIKE cho tiếng Việt

### JobDetailDto

- Complete job information
- Includes: employer, category, location
- Sử dụng `class-transformer` với `@Expose()`

### ApproveJobDto

- `note`: Optional, max 500 chars

### RejectJobDto

- `reason`: Required, 10-1000 chars

## 📊 Business Rules

1. **FIFO Queue**: Jobs sorted by `createdAt` ASC (oldest first)
2. **One-time Decision**: Không cho approve/reject lại
3. **Published Timestamp**: Chỉ set khi approve thành công
4. **Employer Notification**: TODO - gửi email khi reject

## 📝 TODO

- [ ] Tích hợp MailService để gửi email thông báo từ chối
- [ ] Thêm notification cho employer
- [ ] Thêm bulk approval/rejection
- [ ] Thêm filter theo ngày tạo, deadline
- [ ] Export danh sách jobs chờ duyệt
- [ ] Thống kê số lượng jobs approved/rejected theo admin

## 🧪 Testing

Test với Swagger UI tại: `/api/docs`

**Test Flow:**

1. Login as ADMIN
2. GET danh sách jobs pending
3. GET chi tiết một job
4. POST approve hoặc reject
5. Verify job status changed

## 🔗 Related Modules

- **AdminEmployerApprovalModule**: Duyệt hồ sơ NTD
- **JobsModule**: Quản lý tin tuyển dụng
- **MailModule**: Gửi email thông báo (TODO)

## 📚 Tham khảo

- [NestJS Guards](https://docs.nestjs.com/guards)
- [TypeORM Transactions](https://typeorm.io/transactions)
- [Class Transformer](https://github.com/typestack/class-transformer)
