# API GET Danh Sách Job PUBLIC - Implementation Guide

## Tổng Quan

Đã triển khai API **GET /api/jobs** để tìm kiếm việc làm công khai cho Guest/Candidate với đầy đủ tính năng filter, search, sort và pagination.

## Files Đã Tạo/Cập Nhật

### 1. DTO - Query Parameters

**File:** `src/modules/jobs/dto/public-search-jobs.dto.ts`

```typescript
export class PublicSearchJobsDto extends PaginationDto {
  keyword?: string; // Tìm kiếm trong title và description
  location?: string; // Filter theo tỉnh/thành phố
  jobType?: JobType; // Filter theo loại công việc
  experienceLevel?: ExperienceLevel; // Filter theo kinh nghiệm
  salaryMin?: number; // Mức lương tối thiểu
  salaryMax?: number; // Mức lương tối đa
  sort?: JobSortOption; // 'newest' hoặc 'relevant'
}
```

**Enum JobSortOption:**

- `NEWEST`: Sắp xếp theo mới nhất (publishedAt DESC)
- `RELEVANT`: Sắp xếp theo độ liên quan (isUrgent, isFeatured, publishedAt)

### 2. Service - Business Logic

**File:** `src/modules/jobs/jobs.service.ts`

**Method:** `async findAllPublic(dto: PublicSearchJobsDto)`

**Tính năng:**

1. ✅ **Filter cơ bản:**
   - Chỉ lấy jobs có `status = ACTIVE`
   - Chỉ lấy jobs chưa hết hạn (`deadline > now`)

2. ✅ **Keyword Search:**
   - Tìm kiếm trong `title` và `description`
   - Sử dụng `ILIKE` để không phân biệt hoa thường

3. ✅ **Location Filter:**
   - Filter theo `province` trong bảng `employer_locations`
   - Sử dụng `ILIKE` để search linh hoạt

4. ✅ **Job Type Filter:**
   - Filter chính xác theo enum `JobType`

5. ✅ **Experience Level Filter:**
   - Filter chính xác theo enum `ExperienceLevel`

6. ✅ **Salary Range Filter:**
   - Hỗ trợ filter theo `salaryMin` và `salaryMax`
   - Xử lý trường hợp `isNegotiable = true`
   - Logic: Lấy jobs có mức lương overlap với range user chọn

7. ✅ **Sorting:**
   - `NEWEST`: Sắp xếp theo `publishedAt DESC`
   - `RELEVANT`: Ưu tiên `isUrgent DESC`, `isFeatured DESC`, sau đó `publishedAt DESC`

8. ✅ **Pagination:**
   - Sử dụng `createPaginationResponse` utility
   - Trả về `items`, `total`, `page`, `limit`

9. ✅ **Relations:**
   - Load `employer` (thông tin công ty)
   - Load `location` (địa điểm)
   - Load `category` (ngành nghề)

### 3. Controller - API Endpoint

**File:** `src/modules/jobs/jobs.controller.ts`

**Endpoint:** `GET /api/jobs`

**Decorators:**

- `@Public()`: Không yêu cầu authentication
- `@ApiTags('Jobs')`: Swagger grouping
- `@ApiOperation`: Swagger documentation

## Cách Sử Dụng API

### Basic Search

```bash
GET /api/jobs?page=1&limit=10
```

### Search với Keyword

```bash
GET /api/jobs?keyword=fullstack developer&page=1&limit=10
```

### Filter theo Location

```bash
GET /api/jobs?location=Hồ Chí Minh&page=1&limit=20
```

### Filter theo Job Type

```bash
GET /api/jobs?jobType=full_time&page=1&limit=10
```

### Filter theo Experience Level

```bash
GET /api/jobs?experienceLevel=junior&page=1&limit=10
```

### Filter theo Salary Range

```bash
# Tìm jobs có lương 10-20 triệu
GET /api/jobs?salaryMin=10000000&salaryMax=20000000&page=1&limit=10
```

### Multiple Filters

```bash
GET /api/jobs?keyword=nodejs&location=Hà Nội&jobType=full_time&experienceLevel=middle&salaryMin=15000000&salaryMax=30000000&sort=relevant&page=1&limit=20
```

### Sort Options

```bash
# Sắp xếp theo mới nhất
GET /api/jobs?sort=newest&page=1&limit=10

# Sắp xếp theo liên quan nhất (ưu tiên urgent và featured)
GET /api/jobs?sort=relevant&page=1&limit=10
```

## Response Format

### Success Response (200 OK)

```json
{
  "items": [
    {
      "id": "1",
      "employerId": "123",
      "categoryId": "456",
      "locationId": "789",
      "title": "Senior Fullstack Developer",
      "slug": "senior-fullstack-developer-123",
      "description": "We are looking for...",
      "salaryMin": 20000000,
      "salaryMax": 35000000,
      "isNegotiable": false,
      "jobType": "full_time",
      "experienceLevel": "senior",
      "status": "active",
      "deadline": "2025-12-31T23:59:59.000Z",
      "publishedAt": "2025-12-01T10:00:00.000Z",
      "isUrgent": true,
      "isFeatured": false,
      "viewCount": 150,
      "applicationCount": 12,
      "employer": {
        "id": "123",
        "companyName": "Tech Company ABC",
        "companyLogo": "https://..."
      },
      "location": {
        "id": "789",
        "province": "Hồ Chí Minh",
        "district": "Quận 1",
        "detailedAddress": "123 Nguyễn Huệ"
      },
      "category": {
        "id": "456",
        "name": "Information Technology",
        "slug": "it"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

## Query Optimization

### Indexes Được Sử dụng

- `job.status` (indexed)
- `job.deadline` (indexed)
- `job.publishedAt` (indexed)
- `job.employerId` (indexed)
- `job.locationId` (indexed)

### QueryBuilder Features

- ✅ Sử dụng `leftJoinAndSelect` để eager load relations
- ✅ Sử dụng `ILIKE` cho case-insensitive search
- ✅ Tối ưu filter với `andWhere` để tránh N+1 queries
- ✅ Sử dụng pagination helper để tự động count và phân trang

## Validation

### Query Parameters Validation

- `keyword`: string, optional
- `location`: string, optional
- `jobType`: enum JobType, optional
- `experienceLevel`: enum ExperienceLevel, optional
- `salaryMin`: number >= 0, optional
- `salaryMax`: number >= 0, optional
- `sort`: enum JobSortOption, optional (default: 'newest')
- `page`: number >= 1, optional (default: 1)
- `limit`: number >= 1, optional (default: 10)

## Testing

### Swagger UI

Truy cập: `http://localhost:3000/api/docs`

- Tìm endpoint `GET /api/jobs`
- Click "Try it out"
- Nhập parameters
- Click "Execute"

### cURL Examples

```bash
# 1. Basic search
curl -X GET "http://localhost:3000/api/jobs?page=1&limit=10"

# 2. Search với keyword
curl -X GET "http://localhost:3000/api/jobs?keyword=developer&page=1&limit=10"

# 3. Filter theo location và job type
curl -X GET "http://localhost:3000/api/jobs?location=Hồ%20Chí%20Minh&jobType=full_time&page=1&limit=10"

# 4. Filter theo salary range
curl -X GET "http://localhost:3000/api/jobs?salaryMin=15000000&salaryMax=30000000&page=1&limit=10"

# 5. Complex query
curl -X GET "http://localhost:3000/api/jobs?keyword=nodejs&location=Hà%20Nội&experienceLevel=middle&sort=relevant&page=1&limit=20"
```

### Postman Collection

Import các request sau vào Postman:

```json
{
  "info": {
    "name": "Public Jobs API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Jobs",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs?page=1&limit=10",
          "query": [
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Search Jobs by Keyword",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs?keyword=developer&page=1&limit=10",
          "query": [
            { "key": "keyword", "value": "developer" },
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Filter by Location and Type",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/jobs?location=Hồ Chí Minh&jobType=full_time&page=1&limit=10",
          "query": [
            { "key": "location", "value": "Hồ Chí Minh" },
            { "key": "jobType", "value": "full_time" },
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    }
  ]
}
```

## Lưu Ý Khi Sử Dụng

### 1. Performance

- API được optimize với QueryBuilder và index
- Recommend limit <= 50 để tránh load quá nhiều data
- Sử dụng pagination thay vì load all

### 2. Security

- API public, không cần authentication
- Validate tất cả input parameters
- SQL injection được prevent bởi TypeORM parameterized queries

### 3. Extensibility

Dễ dàng mở rộng thêm filters:

- Thêm field vào `PublicSearchJobsDto`
- Thêm `andWhere` clause trong service
- Không cần thay đổi controller

### 4. Best Practices

- ✅ Sử dụng DTO cho validation
- ✅ Tách biệt business logic vào service
- ✅ Sử dụng QueryBuilder thay vì repository methods
- ✅ Document đầy đủ với Swagger
- ✅ Follow REST conventions

## Next Steps

### Có thể cải thiện:

1. **Full-text search**: Sử dụng PostgreSQL full-text search cho keyword
2. **Caching**: Cache kết quả search phổ biến với Redis
3. **Geo search**: Thêm tìm kiếm theo bán kính địa lý
4. **Advanced sorting**: Thêm sort theo salary, view count, etc.
5. **Filter by skills**: Thêm filter theo required_skills array

### Monitoring:

- Log slow queries (> 500ms)
- Track most common search queries
- Monitor API response time

---

**Tác giả:** GitHub Copilot
**Ngày tạo:** 18/12/2025
**Version:** 1.0.0
