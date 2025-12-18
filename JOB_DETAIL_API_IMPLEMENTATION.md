# API GET Chi Tiết Job (Public) - Implementation Guide

## Tổng Quan

Đã triển khai API **GET /api/jobs/:identifier** để xem chi tiết việc làm công khai cho Guest/Candidate với đầy đủ exception handling và tối ưu hóa.

## Files Đã Tạo/Cập Nhật

### 1. DTO - Job Identifier Parameter

**File:** `src/modules/jobs/dto/job-identifier.dto.ts`

```typescript
export class JobIdentifierDto {
  identifier: string; // Có thể là ID (số) hoặc Slug (string)
}
```

**Features:**

- ✅ Hỗ trợ cả ID và Slug trong cùng 1 endpoint
- ✅ Validation với class-validator
- ✅ Swagger documentation đầy đủ

### 2. Service - Business Logic

**File:** `src/modules/jobs/jobs.service.ts`

**Method:** `async findOnePublicByIdentifier(identifier: string)`

#### Flow Xử Lý:

```
1. Xác định identifier là ID hay Slug
   ├─ ID: /^\d+$/ (toàn số)
   └─ Slug: string có ký tự khác

2. Tìm job trong database
   ├─ Không filter status ngay (để có message cụ thể)
   └─ Load relations: employer, employer.user, location, category

3. Kiểm tra job tồn tại
   └─ Không → 404: "Không tìm thấy việc làm với..."

4. Kiểm tra status
   ├─ ACTIVE → OK, tiếp tục
   ├─ EXPIRED → 404: "Tin tuyển dụng này đã hết hạn..."
   ├─ CLOSED → 404: "Tin tuyển dụng này đã đóng..."
   ├─ REMOVED_BY_ADMIN → 404: "Tin tuyển dụng này đã bị gỡ..."
   ├─ REJECTED → 404: "Tin tuyển dụng này không được phê duyệt..."
   └─ Khác → 404: "Tin tuyển dụng này không khả dụng..."

5. Kiểm tra deadline
   └─ Hết hạn → 404: "Tin tuyển dụng này đã hết hạn ứng tuyển..."

6. Tăng view count (async, không block response)
   └─ Sử dụng repository.increment()

7. Return job
```

#### Exception Handling

**Tất cả exceptions đều rõ ràng và user-friendly:**

| Tình Huống                    | HTTP Status | Message                                                    |
| ----------------------------- | ----------- | ---------------------------------------------------------- |
| Job không tồn tại             | 404         | Không tìm thấy việc làm với ID/slug: {identifier}          |
| Status = EXPIRED              | 404         | Tin tuyển dụng này đã hết hạn. Vui lòng tìm việc làm khác. |
| Status = CLOSED               | 404         | Tin tuyển dụng này đã đóng. Công ty đã tuyển đủ người.     |
| Status = REMOVED_BY_ADMIN     | 404         | Tin tuyển dụng này đã bị gỡ bởi quản trị viên.             |
| Status = REJECTED             | 404         | Tin tuyển dụng này không được phê duyệt.                   |
| Status = DRAFT/PENDING/HIDDEN | 404         | Tin tuyển dụng này không khả dụng.                         |
| Deadline đã qua               | 404         | Tin tuyển dụng này đã hết hạn ứng tuyển.                   |

#### Performance Optimization

1. **View Count Increment:**

   ```typescript
   // Chạy async, không chặn response
   this.incrementViewCount(job.id).catch((error) => {
     console.error(`Failed to increment view count for job ${job.id}:`, error);
   });
   ```

2. **Repository Increment:**
   ```typescript
   // Sử dụng SQL INCREMENT thay vì read-modify-write
   await this.jobRepo.increment({ id: jobId }, 'viewCount', 1);
   // SQL: UPDATE jobs SET view_count = view_count + 1 WHERE id = ?
   ```

### 3. Controller - API Endpoint

**File:** `src/modules/jobs/jobs.controller.ts`

**Endpoint:** `GET /api/jobs/:identifier`

**Decorators:**

- `@Public()`: Không yêu cầu authentication
- `@ApiOperation`: Swagger summary và description
- `@ApiResponse`: Document response cho 200 và 404

## Cách Sử Dụng API

### 1. Tìm Job bằng Slug

```bash
GET /api/jobs/senior-fullstack-developer-123
```

**Response 200 OK:**

```json
{
  "id": "1",
  "employerId": "100",
  "categoryId": "10",
  "locationId": "50",
  "title": "Senior Fullstack Developer",
  "slug": "senior-fullstack-developer-123",
  "description": "We are looking for an experienced...",
  "requirements": "- 5+ years experience...",
  "responsibilities": "- Lead development team...",
  "niceToHave": "- Experience with AWS...",
  "salaryMin": 25000000,
  "salaryMax": 40000000,
  "isNegotiable": false,
  "jobType": "full_time",
  "experienceLevel": "senior",
  "positionsAvailable": 2,
  "requiredSkills": ["JavaScript", "TypeScript", "Node.js", "React"],
  "status": "active",
  "deadline": "2026-01-31T23:59:59.000Z",
  "publishedAt": "2025-12-01T10:00:00.000Z",
  "applicationCount": 15,
  "viewCount": 251,
  "isFeatured": true,
  "isUrgent": false,
  "createdAt": "2025-12-01T09:00:00.000Z",
  "updatedAt": "2025-12-18T14:30:00.000Z",
  "employer": {
    "id": "100",
    "userId": "200",
    "companyName": "Tech Innovation Co., Ltd",
    "companyLogo": "https://storage.example.com/logos/tech-innovation.png",
    "companyWebsite": "https://techinnovation.com",
    "companySize": "100-500",
    "industryType": "Information Technology",
    "user": {
      "id": "200",
      "email": "hr@techinnovation.com",
      "status": "active"
    }
  },
  "location": {
    "id": "50",
    "employerId": "100",
    "isHeadquarters": true,
    "province": "Hồ Chí Minh",
    "district": "Quận 1",
    "detailedAddress": "123 Nguyễn Huệ, Phường Bến Nghé"
  },
  "category": {
    "id": "10",
    "name": "Information Technology",
    "slug": "it",
    "description": "IT and Software Development"
  }
}
```

### 2. Tìm Job bằng ID

```bash
GET /api/jobs/1
```

Response tương tự như trên.

### 3. Error Responses

#### Job không tồn tại

```bash
GET /api/jobs/non-existent-slug
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Không tìm thấy việc làm với slug: non-existent-slug",
  "error": "Not Found"
}
```

#### Job đã hết hạn

```bash
GET /api/jobs/expired-job-slug
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Tin tuyển dụng này đã hết hạn. Vui lòng tìm việc làm khác.",
  "error": "Not Found"
}
```

#### Job đã đóng

```bash
GET /api/jobs/closed-job-slug
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Tin tuyển dụng này đã đóng. Công ty đã tuyển đủ người.",
  "error": "Not Found"
}
```

#### Job bị gỡ bởi Admin

```bash
GET /api/jobs/removed-job-slug
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Tin tuyển dụng này đã bị gỡ bởi quản trị viên.",
  "error": "Not Found"
}
```

## Testing

### Swagger UI

Truy cập: `http://localhost:3000/api/docs`

- Tìm endpoint `GET /api/jobs/{identifier}`
- Click "Try it out"
- Nhập identifier (ID hoặc slug)
- Click "Execute"

### cURL Examples

```bash
# 1. Get job by slug
curl -X GET "http://localhost:3000/api/jobs/senior-fullstack-developer-123"

# 2. Get job by ID
curl -X GET "http://localhost:3000/api/jobs/1"

# 3. Test with non-existent job
curl -X GET "http://localhost:3000/api/jobs/non-existent-job"

# 4. Test with expired job (if you have test data)
curl -X GET "http://localhost:3000/api/jobs/expired-job-slug"
```

### Postman Collection

```json
{
  "info": {
    "name": "Job Detail API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Job by Slug",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs/senior-fullstack-developer-123",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "senior-fullstack-developer-123"]
        }
      }
    },
    {
      "name": "Get Job by ID",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "1"]
        }
      }
    },
    {
      "name": "Get Non-existent Job (404)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs/non-existent-job",
          "host": ["{{baseUrl}}"],
          "path": ["api", "jobs", "non-existent-job"]
        }
      }
    }
  ]
}
```

## Code Quality

### Exception Handling ✅

- ✅ Xử lý rõ ràng từng trường hợp error
- ✅ Message user-friendly bằng tiếng Việt
- ✅ Sử dụng HTTP status code chuẩn (404)
- ✅ Không expose internal errors

### Performance ✅

- ✅ View count increment không block response
- ✅ Sử dụng SQL INCREMENT thay vì read-modify-write
- ✅ Load relations cần thiết bằng leftJoinAndSelect
- ✅ Single query thay vì N+1 queries

### Maintainability ✅

- ✅ Code rõ ràng, có comment đầy đủ
- ✅ Tách biệt concerns (controller, service, DTO)
- ✅ Dễ extend thêm logic (vd: track user view history)
- ✅ Follow NestJS best practices

### Security ✅

- ✅ Validate input với DTO
- ✅ Không expose sensitive data
- ✅ SQL injection prevention (TypeORM parameterized queries)
- ✅ Public endpoint - không cần authentication

## Best Practices

### 1. Identifier Detection

```typescript
// Phát hiện ID bằng regex
const isNumericId = /^\d+$/.test(identifier);
```

### 2. Error Messages

```typescript
// Message rõ ràng cho từng trường hợp
if (job.status === JobStatus.EXPIRED) {
  throw new NotFoundException(
    'Tin tuyển dụng này đã hết hạn. Vui lòng tìm việc làm khác.',
  );
}
```

### 3. Async Operations

```typescript
// Không chặn response cho side effects
this.incrementViewCount(job.id).catch((error) => {
  console.error(`Failed to increment view count:`, error);
});
```

### 4. Database Optimization

```typescript
// Sử dụng increment thay vì update
await this.jobRepo.increment({ id: jobId }, 'viewCount', 1);
// Thay vì:
// job.viewCount++;
// await this.jobRepo.save(job);
```

## Next Steps

### Có thể cải thiện:

1. **Tracking User Views:**
   - Lưu lịch sử xem job của user (nếu đã login)
   - Tránh tăng view count nếu user đã xem trong 24h

2. **Related Jobs:**
   - Thêm endpoint để lấy jobs liên quan
   - Filter theo category, location, salary range

3. **Caching:**
   - Cache job detail với Redis (TTL: 5-10 phút)
   - Invalidate cache khi job được update

4. **Analytics:**
   - Track view sources (organic search, direct, referral)
   - Analytics dashboard cho employer

5. **SEO:**
   - Thêm metadata cho frontend render
   - Structured data (JSON-LD) cho Google Jobs

### Testing Checklist:

- [ ] Test với slug hợp lệ → 200 OK
- [ ] Test với ID hợp lệ → 200 OK
- [ ] Test với slug không tồn tại → 404
- [ ] Test với job status = EXPIRED → 404 với message đúng
- [ ] Test với job status = CLOSED → 404 với message đúng
- [ ] Test với job status = REMOVED_BY_ADMIN → 404 với message đúng
- [ ] Test với job deadline đã qua → 404 với message đúng
- [ ] Verify view count tăng sau mỗi request
- [ ] Verify relations được load đầy đủ
- [ ] Load test với 100 concurrent requests

---

**Tác giả:** GitHub Copilot  
**Ngày tạo:** 18/12/2025  
**Version:** 1.0.0
