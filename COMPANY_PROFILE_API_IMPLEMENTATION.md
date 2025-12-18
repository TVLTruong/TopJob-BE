# API GET Xem Hồ Sơ Company (Public) - Implementation Guide

## Tổng Quan

Đã triển khai API **GET /api/companies/:id** để xem hồ sơ công ty công khai cho Guest/Candidate với exception handling đầy đủ và response tối ưu.

## Files Đã Cập Nhật

### 1. Service - Business Logic

**File:** `src/modules/companies/companies.service.ts`

**Method:** `async findOnePublic(id: string)`

#### Flow Xử Lý:

```
1. Tìm employer trong database
   └─ Không filter status ngay (để có message cụ thể)
   └─ Load relation: locations

2. Kiểm tra employer tồn tại
   └─ Không → 404: "Không tìm thấy công ty với ID: {id}"

3. Kiểm tra status
   ├─ ACTIVE → ✅ OK, tiếp tục
   ├─ PENDING_APPROVAL → 404: "Hồ sơ công ty này đang chờ phê duyệt."
   ├─ BANNED → 404: "Hồ sơ công ty này đã bị khóa."
   └─ Other → 404: "Hồ sơ công ty này không khả dụng."

4. Trả về company profile
   └─ Chỉ trả fields cần thiết (không expose sensitive data)
   └─ Bao gồm locations array
```

#### Exception Handling

**Tất cả exceptions đều rõ ràng và user-friendly:**

| Tình Huống                | HTTP Status | Message                               |
| ------------------------- | ----------- | ------------------------------------- |
| Company không tồn tại     | 404         | Không tìm thấy công ty với ID: {id}   |
| Status = PENDING_APPROVAL | 404         | Hồ sơ công ty này đang chờ phê duyệt. |
| Status = BANNED           | 404         | Hồ sơ công ty này đã bị khóa.         |
| Status = Other            | 404         | Hồ sơ công ty này không khả dụng.     |

#### Response Structure

```typescript
{
  id: string;
  companyName: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  foundedYear: number | null;
  companySize: CompanySize | null;
  contactEmail: string | null;
  contactPhone: string | null;
  linkedlnUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  benefits: string[] | null;
  locations: EmployerLocation[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Note:** Không trả về các fields nhạy cảm như:

- `userId` (internal reference)
- `fullName`, `workTitle` (contact person info - private)
- `isApproved`, `status`, `profileStatus` (internal status)

### 2. Controller - API Endpoint

**File:** `src/modules/companies/companies.controller.ts`

**Endpoint:** `GET /api/companies/:id`

**Decorators:**

- `@Public()`: Không yêu cầu authentication
- `@ApiOperation`: Swagger summary và description
- `@ApiResponse`: Document response cho 200 và 404 với schema chi tiết

## Cách Sử Dụng API

### 1. Xem hồ sơ công ty

```bash
GET /api/companies/1
```

**Response 200 OK:**

```json
{
  "id": "1",
  "companyName": "Tech Innovation Co., Ltd",
  "description": "Leading technology company specializing in AI and Machine Learning solutions. We help businesses transform with cutting-edge technology.",
  "website": "https://techinnovation.com",
  "logoUrl": "https://storage.example.com/logos/tech-innovation.png",
  "coverImageUrl": "https://storage.example.com/covers/tech-innovation-cover.jpg",
  "foundedYear": 2015,
  "companySize": "medium",
  "contactEmail": "hr@techinnovation.com",
  "contactPhone": "0901234567",
  "linkedlnUrl": "https://linkedin.com/company/tech-innovation",
  "facebookUrl": "https://facebook.com/techinnovation",
  "xUrl": "https://x.com/techinnovation",
  "benefits": [
    "Lương thưởng hấp dẫn theo năng lực",
    "Bảo hiểm sức khỏe đầy đủ",
    "Du lịch công ty hàng năm",
    "Môi trường làm việc trẻ trung, sáng tạo",
    "Cơ hội thăng tiến rõ ràng"
  ],
  "locations": [
    {
      "id": "1",
      "employerId": "1",
      "isHeadquarters": true,
      "province": "Hồ Chí Minh",
      "district": "Quận 1",
      "detailedAddress": "123 Nguyễn Huệ, Phường Bến Nghé",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-12-18T10:00:00.000Z"
    },
    {
      "id": "2",
      "employerId": "1",
      "isHeadquarters": false,
      "province": "Hà Nội",
      "district": "Quận Ba Đình",
      "detailedAddress": "456 Láng Hạ, Phường Láng Hạ",
      "createdAt": "2025-03-01T00:00:00.000Z",
      "updatedAt": "2025-12-18T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

### 2. Error Responses

#### Company không tồn tại

```bash
GET /api/companies/99999
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Không tìm thấy công ty với ID: 99999",
  "error": "Not Found"
}
```

#### Company đang chờ phê duyệt

```bash
GET /api/companies/5
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Hồ sơ công ty này đang chờ phê duyệt.",
  "error": "Not Found"
}
```

#### Company đã bị khóa

```bash
GET /api/companies/10
```

**Response 404 Not Found:**

```json
{
  "statusCode": 404,
  "message": "Hồ sơ công ty này đã bị khóa.",
  "error": "Not Found"
}
```

## Testing

### Swagger UI

Truy cập: `http://localhost:3000/api/docs`

- Tìm endpoint `GET /api/companies/{id}`
- Click "Try it out"
- Nhập company ID
- Click "Execute"

### cURL Examples

```bash
# 1. Get company by ID
curl -X GET "http://localhost:3000/api/companies/1"

# 2. Test with non-existent company
curl -X GET "http://localhost:3000/api/companies/99999"

# 3. Test with pending approval company (if you have test data)
curl -X GET "http://localhost:3000/api/companies/5"

# 4. Test with banned company (if you have test data)
curl -X GET "http://localhost:3000/api/companies/10"
```

### Postman Collection

```json
{
  "info": {
    "name": "Company Profile API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Company Profile",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies/1",
          "host": ["{{baseUrl}}"],
          "path": ["api", "companies", "1"]
        }
      }
    },
    {
      "name": "Get Non-existent Company (404)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies/99999",
          "host": ["{{baseUrl}}"],
          "path": ["api", "companies", "99999"]
        }
      }
    },
    {
      "name": "Get Pending Company (404)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/companies/5",
          "host": ["{{baseUrl}}"],
          "path": ["api", "companies", "5"]
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

### Security ✅

- ✅ Validate input với DTO
- ✅ Không expose sensitive data (userId, contact person info)
- ✅ Chỉ trả về ACTIVE employers
- ✅ Public endpoint - không cần authentication

### Data Privacy ✅

```typescript
// ❌ BAD: Expose toàn bộ employer entity
return employer;

// ✅ GOOD: Chỉ trả fields cần thiết
return {
  id: employer.id,
  companyName: employer.companyName,
  description: employer.description,
  // ... only public fields
  locations: employer.locations,
};
```

### Maintainability ✅

- ✅ Code rõ ràng, có comment đầy đủ
- ✅ Tách biệt concerns (controller, service)
- ✅ Dễ extend thêm logic (vd: track views, add active jobs)
- ✅ Follow NestJS best practices

## Best Practices

### 1. Error Messages

```typescript
// Message rõ ràng cho từng trường hợp
if (employer.status === EmployerStatus.PENDING_APPROVAL) {
  throw new NotFoundException('Hồ sơ công ty này đang chờ phê duyệt.');
}
```

### 2. Response Shaping

```typescript
// Chỉ trả fields public, không expose sensitive data
return {
  id: employer.id,
  companyName: employer.companyName,
  // ... chỉ public fields
  locations: employer.locations,
};
```

### 3. Status Check

```typescript
// Không filter trong where clause
// Để có thể return specific error message
const employer = await this.employerRepo.findOne({
  where: { id },
  // KHÔNG: where: { id, status: EmployerStatus.ACTIVE }
});

// Check status sau để có message cụ thể
if (employer.status !== EmployerStatus.ACTIVE) {
  // Handle each status specifically
}
```

## Integration với Frontend

### React/Next.js Example

```typescript
// API client
async function getCompanyProfile(companyId: string) {
  try {
    const response = await fetch(`/api/companies/${companyId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch company:', error);
    throw error;
  }
}

// Component
function CompanyProfile({ companyId }: { companyId: string }) {
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanyProfile(companyId)
      .then(setCompany)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!company) return null;

  return (
    <div>
      <h1>{company.companyName}</h1>
      <p>{company.description}</p>

      <h2>Locations</h2>
      <ul>
        {company.locations.map(loc => (
          <li key={loc.id}>
            {loc.detailedAddress}, {loc.district}, {loc.province}
            {loc.isHeadquarters && <Badge>Headquarters</Badge>}
          </li>
        ))}
      </ul>

      {company.benefits && (
        <>
          <h2>Benefits</h2>
          <ul>
            {company.benefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

## Next Steps

### Có thể cải thiện:

1. **Add Active Jobs:**

   ```typescript
   // Load active jobs của company
   const activeJobs = await this.jobRepo.find({
     where: {
       employerId: employer.id,
       status: JobStatus.ACTIVE,
       deadline: MoreThan(new Date()),
     },
     order: { isUrgent: 'DESC', publishedAt: 'DESC' },
     take: 10,
   });

   return {
     ...companyProfile,
     jobs: activeJobs,
   };
   ```

2. **View Count:**

   ```typescript
   // Track company profile views
   @Column({ type: 'int', default: 0, name: 'view_count' })
   viewCount: number;

   // Increment async
   this.incrementViewCount(employer.id).catch(console.error);
   ```

3. **Support Slug:**

   ```typescript
   // Thêm slug field vào employer entity
   @Column({ type: 'varchar', unique: true })
   slug: string;

   // Service: detect ID vs Slug
   const isNumericId = /^\d+$/.test(identifier);
   const employer = await this.employerRepo.findOne({
     where: isNumericId ? { id: identifier } : { slug: identifier },
   });
   ```

4. **Related Companies:**

   ```typescript
   // Suggest companies trong cùng industry/size
   const relatedCompanies = await this.employerRepo.find({
     where: {
       status: EmployerStatus.ACTIVE,
       companySize: employer.companySize,
       id: Not(employer.id),
     },
     take: 5,
   });
   ```

5. **Statistics:**
   ```typescript
   // Thêm statistics vào response
   const stats = {
     totalJobs: await this.jobRepo.count({
       where: { employerId: employer.id },
     }),
     activeJobs: await this.jobRepo.count({
       where: {
         employerId: employer.id,
         status: JobStatus.ACTIVE,
       },
     }),
     totalLocations: employer.locations.length,
     companyAge: employer.foundedYear
       ? new Date().getFullYear() - employer.foundedYear
       : null,
   };
   ```

## Testing Checklist

- [ ] Test với valid company ID → 200 OK
- [ ] Test với non-existent ID → 404
- [ ] Test với company status = PENDING_APPROVAL → 404 với message đúng
- [ ] Test với company status = BANNED → 404 với message đúng
- [ ] Verify locations được load đầy đủ
- [ ] Verify không expose sensitive data (userId, fullName, etc.)
- [ ] Verify chỉ trả về ACTIVE companies
- [ ] Test response structure khớp với schema
- [ ] Check SQL query performance
- [ ] Verify Swagger documentation correct

---

**Tác giả:** GitHub Copilot  
**Ngày tạo:** 18/12/2025  
**Version:** 1.0.0
