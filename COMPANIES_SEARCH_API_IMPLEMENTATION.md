# API GET Tìm Kiếm Company (Public) - Implementation Guide

## Tổng Quan

Đã triển khai API **GET /api/companies** để tìm kiếm công ty công khai cho Guest/Candidate với đầy đủ tính năng filter, pagination và tối ưu hóa QueryBuilder.

## Files Đã Tạo/Cập Nhật

### 1. DTO - Query Parameters

**File:** `src/modules/companies/dto/search-companies.dto.ts`

```typescript
export class SearchCompaniesDto extends PaginationDto {
  keyword?: string; // Tìm kiếm trong company name
  city?: string; // Filter theo tỉnh/thành phố
  industry?: string; // Filter theo ngành nghề (search in description)
  companySize?: CompanySize; // Filter theo quy mô công ty
}
```

**Validation:**

- ✅ `keyword`: string, optional
- ✅ `city`: string, optional
- ✅ `industry`: string, optional
- ✅ `companySize`: enum CompanySize, optional
- ✅ Extends `PaginationDto` (page, limit)

**CompanySize Enum:**

```typescript
enum CompanySize {
  STARTUP = 'startup', // 1-10 nhân viên
  SMALL = 'small', // 11-50 nhân viên
  MEDIUM = 'medium', // 51-200 nhân viên
  LARGE = 'large', // 201-1000 nhân viên
  ENTERPRISE = 'enterprise', // 1000+ nhân viên
}
```

### 2. Service - Business Logic

**File:** `src/modules/companies/companies.service.ts`

**Method:** `async findAllPublic(dto: SearchCompaniesDto)`

#### Query Flow:

```
1. Khởi tạo QueryBuilder
   └─ leftJoinAndSelect employer.locations

2. Filter cơ bản
   └─ employer.status = ACTIVE

3. Keyword Search (company name)
   └─ ILIKE %keyword%

4. City Filter
   └─ EXISTS subquery trong employer_locations
   └─ Check province ILIKE %city%

5. Company Size Filter
   └─ employer.companySize = ?

6. Industry Filter
   └─ Search trong description ILIKE %industry%
   └─ Note: Không có industry field riêng

7. Sorting
   └─ ORDER BY companyName ASC

8. Pagination
   └─ createPaginationResponse helper
```

#### QueryBuilder Implementation:

```typescript
const queryBuilder = this.employerRepo
  .createQueryBuilder('employer')
  .leftJoinAndSelect('employer.locations', 'locations')
  .where('employer.status = :status', { status: EmployerStatus.ACTIVE });

// Keyword search
if (dto.keyword) {
  queryBuilder.andWhere('employer.companyName ILIKE :keyword', {
    keyword: `%${dto.keyword.trim()}%`,
  });
}

// City filter (EXISTS subquery)
if (dto.city) {
  queryBuilder.andWhere(
    'EXISTS (SELECT 1 FROM employer_locations el WHERE el.employer_id = employer.id AND el.province ILIKE :city)',
    { city: `%${dto.city.trim()}%` },
  );
}

// Company size filter
if (dto.companySize) {
  queryBuilder.andWhere('employer.companySize = :companySize', {
    companySize: dto.companySize,
  });
}

// Industry filter (trong description)
if (dto.industry) {
  queryBuilder.andWhere('employer.description ILIKE :industry', {
    industry: `%${dto.industry.trim()}%`,
  });
}
```

### 3. Controller - API Endpoint

**File:** `src/modules/companies/companies.controller.ts`

**Endpoint:** `GET /api/companies`

**Decorators:**

- `@Public()`: Không yêu cầu authentication
- `@ApiTags('Companies')`: Swagger grouping
- `@ApiOperation`: Swagger documentation

## Cách Sử Dụng API

### 1. Basic Search - Lấy tất cả companies

```bash
GET /api/companies?page=1&limit=10
```

**Response 200 OK:**

```json
{
  "items": [
    {
      "id": "1",
      "userId": "100",
      "fullName": "Nguyen Van A",
      "workTitle": "HR Manager",
      "companyName": "Tech Innovation Co., Ltd",
      "description": "Leading technology company specializing in AI and Machine Learning...",
      "website": "https://techinnovation.com",
      "logoUrl": "https://storage.example.com/logos/tech-innovation.png",
      "coverImageUrl": "https://storage.example.com/covers/tech-innovation-cover.jpg",
      "foundedYear": 2015,
      "companySize": "medium",
      "contactEmail": "hr@techinnovation.com",
      "contactPhone": "0901234567",
      "linkedlnUrl": "https://linkedin.com/company/tech-innovation",
      "facebookUrl": "https://facebook.com/techinnovation",
      "status": "active",
      "profileStatus": "approved",
      "benefits": [
        "Lương thưởng hấp dẫn",
        "Bảo hiểm đầy đủ",
        "Du lịch hàng năm",
        "Môi trường trẻ trung"
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-18T10:00:00.000Z",
      "locations": [
        {
          "id": "1",
          "employerId": "1",
          "isHeadquarters": true,
          "province": "Hồ Chí Minh",
          "district": "Quận 1",
          "detailedAddress": "123 Nguyễn Huệ, Phường Bến Nghé"
        },
        {
          "id": "2",
          "employerId": "1",
          "isHeadquarters": false,
          "province": "Hà Nội",
          "district": "Quận Ba Đình",
          "detailedAddress": "456 Láng Hạ"
        }
      ]
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

### 2. Search với Keyword

```bash
GET /api/companies?keyword=tech&page=1&limit=10
```

Tìm tất cả công ty có "tech" trong tên.

### 3. Filter theo City

```bash
GET /api/companies?city=Hồ Chí Minh&page=1&limit=20
```

Lấy công ty có ít nhất 1 location ở Hồ Chí Minh.

### 4. Filter theo Company Size

```bash
GET /api/companies?companySize=medium&page=1&limit=10
```

Lấy công ty có quy mô medium (51-200 nhân viên).

### 5. Filter theo Industry

```bash
GET /api/companies?industry=technology&page=1&limit=10
```

Tìm công ty có "technology" trong description.

### 6. Multiple Filters

```bash
GET /api/companies?keyword=tech&city=Hồ Chí Minh&companySize=medium&industry=software&page=1&limit=20
```

Kết hợp nhiều filters.

## Query Optimization

### 1. Index Usage

```sql
-- Indexes được sử dụng
CREATE INDEX idx_employers_status ON employers(status);
CREATE INDEX idx_employers_company_name ON employers(company_name);
CREATE INDEX idx_employer_locations_province ON employer_locations(province);
```

### 2. EXISTS Subquery vs JOIN

```typescript
// ✅ Tốt: Sử dụng EXISTS subquery
'EXISTS (SELECT 1 FROM employer_locations el
  WHERE el.employer_id = employer.id
  AND el.province ILIKE :city)'

// ❌ Tránh: INNER JOIN có thể duplicate rows nếu employer có nhiều locations
.innerJoin('employer.locations', 'location')
.where('location.province ILIKE :city')
```

### 3. Load Relations Efficiently

```typescript
// ✅ leftJoinAndSelect: Load tất cả locations
.leftJoinAndSelect('employer.locations', 'locations')

// Kết quả: 1 query với JOIN, không có N+1 problem
```

## Performance Considerations

### Database Query

```sql
-- Generated SQL
SELECT employer.*, locations.*
FROM employers employer
LEFT JOIN employer_locations locations ON locations.employer_id = employer.id
WHERE employer.status = 'active'
  AND employer.company_name ILIKE '%tech%'
  AND EXISTS (
    SELECT 1 FROM employer_locations el
    WHERE el.employer_id = employer.id
    AND el.province ILIKE '%Hồ Chí Minh%'
  )
  AND employer.company_size = 'medium'
ORDER BY employer.company_name ASC
LIMIT 10 OFFSET 0;
```

### Query Metrics (ước tính)

- **Simple query** (no filters): ~10-20ms
- **With filters**: ~20-50ms
- **With pagination**: Same (using LIMIT/OFFSET)

## Testing

### Swagger UI

Truy cập: `http://localhost:3000/api/docs`

- Tìm endpoint `GET /api/companies`
- Click "Try it out"
- Nhập filters và pagination
- Click "Execute"

### cURL Examples

```bash
# 1. Basic search
curl -X GET "http://localhost:3000/api/companies?page=1&limit=10"

# 2. Search với keyword
curl -X GET "http://localhost:3000/api/companies?keyword=tech&page=1&limit=10"

# 3. Filter theo city
curl -X GET "http://localhost:3000/api/companies?city=Hồ%20Chí%20Minh&page=1&limit=10"

# 4. Filter theo company size
curl -X GET "http://localhost:3000/api/companies?companySize=medium&page=1&limit=10"

# 5. Multiple filters
curl -X GET "http://localhost:3000/api/companies?keyword=tech&city=Hà%20Nội&companySize=large&page=1&limit=20"
```

### Postman Collection

```json
{
  "info": {
    "name": "Companies Search API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Companies",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies?page=1&limit=10",
          "query": [
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Search Companies by Keyword",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies?keyword=tech&page=1&limit=10",
          "query": [
            { "key": "keyword", "value": "tech" },
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Filter by City",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies?city=Hồ Chí Minh&page=1&limit=10",
          "query": [
            { "key": "city", "value": "Hồ Chí Minh" },
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "10" }
          ]
        }
      }
    },
    {
      "name": "Multiple Filters",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies?keyword=tech&city=Hà Nội&companySize=medium&page=1&limit=20",
          "query": [
            { "key": "keyword", "value": "tech" },
            { "key": "city", "value": "Hà Nội" },
            { "key": "companySize", "value": "medium" },
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "20" }
          ]
        }
      }
    }
  ]
}
```

## Code Quality

### Best Practices ✅

- ✅ Sử dụng QueryBuilder thay vì repository methods
- ✅ Parameterized queries (SQL injection prevention)
- ✅ ILIKE cho case-insensitive search
- ✅ EXISTS subquery cho city filter (tránh duplicate rows)
- ✅ leftJoinAndSelect để load relations (tránh N+1)
- ✅ Pagination helper cho consistent response
- ✅ Swagger documentation đầy đủ

### Security ✅

- ✅ Input validation với DTO
- ✅ SQL injection prevention (TypeORM parameterized queries)
- ✅ Public endpoint - không cần authentication
- ✅ Chỉ trả về ACTIVE employers

### Maintainability ✅

- ✅ Code rõ ràng với comments
- ✅ Tách biệt concerns (Controller, Service, DTO)
- ✅ Dễ extend thêm filters
- ✅ Follow NestJS best practices

## Limitations & Future Improvements

### Current Limitations

1. **Industry Filter:**
   - Hiện tại search trong `description` field
   - Không có dedicated industry/category field trên employer entity
   - Có thể không chính xác

2. **No Sorting Options:**
   - Hiện tại chỉ sort theo company name ASC
   - Chưa hỗ trợ sort theo founded year, company size, etc.

3. **City Filter:**
   - Sử dụng EXISTS subquery
   - Có thể chậm nếu employer có quá nhiều locations

### Future Improvements

1. **Industry/Category Relation:**

   ```typescript
   // Thêm vào Employer entity
   @ManyToMany(() => CompanyCategory)
   @JoinTable()
   categories: CompanyCategory[];

   // Query
   queryBuilder
     .leftJoin('employer.categories', 'category')
     .andWhere('category.slug = :industry', { industry: dto.industry });
   ```

2. **Advanced Sorting:**

   ```typescript
   // DTO
   sort?: 'name' | 'newest' | 'oldest' | 'size';

   // Service
   if (dto.sort === 'newest') {
     queryBuilder.orderBy('employer.createdAt', 'DESC');
   } else if (dto.sort === 'size') {
     queryBuilder.orderBy('employer.companySize', 'DESC');
   }
   ```

3. **Full-Text Search:**

   ```typescript
   // PostgreSQL full-text search
   queryBuilder.andWhere(
     "to_tsvector('english', employer.companyName || ' ' || COALESCE(employer.description, '')) @@ plainto_tsquery('english', :keyword)",
     { keyword: dto.keyword },
   );
   ```

4. **Caching:**

   ```typescript
   // Redis cache cho popular queries
   const cacheKey = `companies:search:${JSON.stringify(dto)}`;
   const cached = await this.cacheService.get(cacheKey);
   if (cached) return cached;
   // ... query database
   await this.cacheService.set(cacheKey, result, 300); // 5 min TTL
   ```

5. **Statistics:**
   ```typescript
   // Thêm trường vào response
   {
     items: [...],
     total: 150,
     statistics: {
       totalLocations: 450,
       averageCompanyAge: 8.5,
       companySizeDistribution: {
         small: 50,
         medium: 60,
         large: 40
       }
     }
   }
   ```

## Testing Checklist

- [ ] Test với không có filters → trả về tất cả ACTIVE companies
- [ ] Test với keyword → filter correct
- [ ] Test với city → chỉ trả về companies có location ở city đó
- [ ] Test với companySize → filter correct
- [ ] Test với industry → search trong description
- [ ] Test với multiple filters → kết hợp đúng
- [ ] Test pagination → page, limit correct
- [ ] Test với invalid page/limit → validation error
- [ ] Verify chỉ trả về status = ACTIVE
- [ ] Verify locations được load đầy đủ
- [ ] Check SQL query performance
- [ ] Load test với 100 concurrent requests

---

**Tác giả:** GitHub Copilot  
**Ngày tạo:** 18/12/2025  
**Version:** 1.0.0
