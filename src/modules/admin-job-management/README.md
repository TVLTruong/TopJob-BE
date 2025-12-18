# Admin Job Management Module

## Overview

Domain-driven NestJS module for administrative management of job posts in the TopJob platform. Provides comprehensive job management capabilities including viewing all jobs with various statuses and force removing jobs that violate policies.

## Features

- **Job List**: Paginated list with search and status filtering (ACTIVE, PENDING, REJECTED)
- **Detailed View**: Complete job information with employer, category, and location
- **Force Remove**: Admin can remove jobs and set status to REMOVED_BY_ADMIN
- **Violation Handling**: Suitable for processing violation reports
- **Optional Reason**: Track removal reason for audit purposes

## Architecture

### Domain Model

```
Employer (1) ───has───> (n) Job
Job (n) ───belongs to───> (1) Category
Job (n) ───has location───> (1) EmployerLocation
Admin performs remove → Job status = REMOVED_BY_ADMIN
```

### Transaction Boundaries

- **Remove Job**: Single transaction, pessimistic lock on job record
- **Job becomes invisible**: Candidates cannot see removed jobs

## API Endpoints

### 1. Get Job List

```http
GET /admin/jobs
Authorization: Bearer {admin_token}
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number (1-based) | 1 |
| limit | number | Items per page (1-100) | 10 |
| search | string | Search in title, company, city | - |
| status | JobStatus | Filter by job status | - |
| sortBy | string | Sort field | createdAt |
| sortOrder | ASC\|DESC | Sort direction | DESC |

**Response:**

```typescript
{
  "data": [
    {
      "id": "123",
      "title": "Senior Backend Developer",
      "slug": "senior-backend-developer-123",
      "status": "ACTIVE",
      "jobType": "FULL_TIME",
      "salaryMin": 20000000,
      "salaryMax": 35000000,
      "isNegotiable": true,
      "deadline": "2024-12-31T23:59:59.000Z",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "applicationCount": 45,
      "viewCount": 520,
      "isFeatured": false,
      "isUrgent": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "employer": {
        "id": "456",
        "companyName": "Tech Corp Vietnam",
        "companyLogo": "https://...",
        "status": "ACTIVE",
        "createdAt": "2023-12-01T00:00:00.000Z"
      },
      "category": {
        "id": "10",
        "name": "Software Development",
        "slug": "software-development"
      },
      "location": {
        "id": "789",
        "address": "123 Main St",
        "city": "Ho Chi Minh City",
        "country": "Vietnam"
      }
    }
  ],
  "meta": {
    "total": 250,
    "page": 1,
    "limit": 10,
    "totalPages": 25
  }
}
```

### 2. Get Job Detail

```http
GET /admin/jobs/:id
Authorization: Bearer {admin_token}
```

**Response:**

```typescript
{
  "id": "123",
  "employerId": "456",
  "categoryId": "10",
  "locationId": "789",
  "title": "Senior Backend Developer",
  "slug": "senior-backend-developer-123",
  "description": "We are seeking a talented Senior Backend Developer...",
  "requirements": "- 5+ years experience with Node.js\n- Strong TypeScript skills...",
  "responsibilities": "- Design and implement scalable APIs\n- Mentor junior developers...",
  "niceToHave": "- Experience with microservices\n- AWS/GCP knowledge...",
  "salaryMin": 20000000,
  "salaryMax": 35000000,
  "isNegotiable": true,
  "jobType": "FULL_TIME",
  "experienceLevel": "SENIOR",
  "positionsAvailable": 2,
  "requiredSkills": ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
  "status": "ACTIVE",
  "deadline": "2024-12-31T23:59:59.000Z",
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "applicationCount": 45,
  "viewCount": 520,
  "isFeatured": false,
  "isUrgent": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "employer": { ... },
  "category": { ... },
  "location": { ... }
}
```

### 3. Remove Job (Force by Admin)

```http
POST /admin/jobs/:id/remove
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Job post chứa nội dung vi phạm chính sách tuyển dụng"
}
```

**Business Rules:**

- Can remove jobs with any status (typically ACTIVE)
- Sets status to REMOVED_BY_ADMIN
- Job becomes invisible to candidates immediately
- Employer cannot undo this action
- Optional removal reason (10-500 chars)
- Suitable for handling violation reports

**Response (Success):**

```typescript
{
  "message": "Job đã được gỡ bởi admin thành công",
  "jobId": "123",
  "status": "REMOVED_BY_ADMIN"
}
```

**Response (Already Removed):**

```typescript
{
  "statusCode": 400,
  "message": "Job đã bị gỡ bởi admin trước đó",
  "error": "Bad Request"
}
```

## Job Status Flow

```
DRAFT → PENDING_APPROVAL → ACTIVE
                         ↓
                    REMOVED_BY_ADMIN (Admin force remove)
                         ↓
                  Hidden from candidates
```

**Other Status Transitions:**

- ACTIVE → EXPIRED (deadline passed)
- ACTIVE → CLOSED (employer closes)
- ACTIVE → HIDDEN (employer hides)
- PENDING_APPROVAL → REJECTED (admin rejects)

## Technical Implementation

### Service Layer

**File:** `admin-job-management.service.ts`

**Key Methods:**

```typescript
async getJobList(query: QueryJobDto): Promise<PaginationResponseDto<any>>
async getJobDetail(jobId: string): Promise<JobDetailDto>
async removeJob(jobId: string, adminId: string, dto: RemoveJobDto): Promise<void>
```

**Transaction Handling:**

- Uses `QueryRunner` for transaction management
- Pessimistic write locks: `lock: { mode: 'pessimistic_write' }`
- Prevents race conditions on concurrent admin actions

**Search Implementation:**

- ILIKE-based search across: job title, company name, location city
- Multi-field search with OR conditions
- Case-insensitive Vietnamese text support

### Controller Layer

**File:** `admin-job-management.controller.ts`

**Protection:**

- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(UserRole.ADMIN)`
- Employers CANNOT access these endpoints

**Swagger Documentation:**

- `@ApiTags('Admin - Job Management')`
- Detailed `@ApiOperation`, `@ApiParam`, `@ApiResponse` annotations
- Comprehensive error response documentation

### DTOs (Data Transfer Objects)

#### QueryJobDto

```typescript
class QueryJobDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsEnum(['createdAt', 'publishedAt', 'deadline', 'title', 'applicationCount'])
  sortBy?:
    | 'createdAt'
    | 'publishedAt'
    | 'deadline'
    | 'title'
    | 'applicationCount';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
```

#### RemoveJobDto

```typescript
class RemoveJobDto {
  @IsOptional()
  @IsString()
  @Length(10, 500)
  reason?: string;
}
```

#### JobDetailDto

```typescript
class JobDetailDto {
  id: string;
  employerId: string;
  categoryId: string;
  locationId: string;
  title: string;
  slug: string;
  description: string | null;
  requirements: string | null;
  // ... all job fields
  employer: JobEmployerInfoDto;
  category: JobCategoryInfoDto;
  location: JobLocationInfoDto;
}
```

## Database Entities

### Job Entity

```typescript
@Entity('jobs')
class Job {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column('bigint')
  employerId: string;

  @Column({ length: 255 })
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @ManyToOne(() => Employer, (employer) => employer.jobs)
  employer: Employer;

  @ManyToOne(() => JobCategory, (category) => category.jobs)
  category: JobCategory;

  @ManyToOne(() => EmployerLocation, (location) => location.jobs)
  location: EmployerLocation;
}
```

### JobStatus Enum

```typescript
enum JobStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLOSED = 'closed',
  HIDDEN = 'hidden',
  REJECTED = 'rejected',
  REMOVED_BY_ADMIN = 'removed_by_admin', // Admin force remove
}
```

## Business Rules

### 1. Job Visibility

- **ACTIVE**: Visible to candidates, accepting applications
- **REMOVED_BY_ADMIN**: Hidden from candidates, cannot apply
- **PENDING_APPROVAL**: Only admin can see, awaiting approval
- **REJECTED**: Hidden from candidates, employer notified

### 2. Admin Authority

- Admin can remove jobs with any status
- Removal is immediate and irreversible by employer
- Employer cannot access admin removal endpoints
- Optional reason tracking for accountability

### 3. Violation Handling

- Suitable for processing candidate/employer reports
- Removal reason documents policy violation
- Job becomes invisible immediately
- Audit trail via logging

### 4. Data Integrity

- Transaction-safe operations
- Pessimistic locking prevents race conditions
- Status validation before removal

## Error Handling

### Common Errors

| Status Code | Error        | Cause                              |
| ----------- | ------------ | ---------------------------------- |
| 400         | Bad Request  | Job already removed, invalid input |
| 401         | Unauthorized | Missing or invalid JWT token       |
| 403         | Forbidden    | Non-admin user attempting access   |
| 404         | Not Found    | Job ID does not exist              |

### Error Response Format

```typescript
{
  "statusCode": 400,
  "message": "Job đã bị gỡ bởi admin trước đó",
  "error": "Bad Request"
}
```

## Security Considerations

### Authentication

- JWT-based authentication required
- Token must contain valid admin user ID
- Token expiration enforced by JwtAuthGuard

### Authorization

- Role-based access control (RBAC)
- Only `UserRole.ADMIN` can access endpoints
- RolesGuard validates user role from JWT payload
- Employers explicitly blocked from accessing

### Input Validation

- All DTOs use class-validator decorators
- Removal reason length: 10-500 characters
- Status enum validation
- Pagination limits: 1-100 items per page

## Usage Examples

### Example 1: Search Active Jobs

```bash
curl -X GET "http://localhost:3000/admin/jobs?status=ACTIVE&search=developer&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Example 2: Remove Violating Job

```bash
curl -X POST "http://localhost:3000/admin/jobs/123/remove" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Job post chứa nội dung phân biệt đối xử"}'
```

### Example 3: View Pending Approval Jobs

```bash
curl -X GET "http://localhost:3000/admin/jobs?status=PENDING_APPROVAL&sortBy=createdAt&sortOrder=ASC" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Example 4: View Job Detail

```bash
curl -X GET "http://localhost:3000/admin/jobs/123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Logging

### Service-Level Logging

```typescript
Logger.log(
  `Admin ${adminId} removed job ${jobId} (${job.title}). Reason: ${dto.reason}`,
);
Logger.error(`Error in getJobList: ${error.message}`, error.stack);
```

### What Gets Logged

- Admin removal actions with job ID and title
- Removal reason (if provided)
- Error details with stack traces
- Query parameters for list operations

## TODO / Future Enhancements

### High Priority

- [ ] **Email Notifications**: Notify employer when job is removed
- [ ] **Audit Trail**: Log all admin actions to audit table with reason
- [ ] **Restore Capability**: Allow admin to restore removed jobs
- [ ] **Bulk Operations**: Remove multiple jobs at once

### Medium Priority

- [ ] **Statistics**: Count removed jobs by reason, date range
- [ ] **Export**: Export job list to CSV/Excel
- [ ] **Advanced Filters**: Filter by employer, category, salary range
- [ ] **Job History**: View job edit history and status changes

### Low Priority

- [ ] **Auto-Remove**: Automatically remove jobs based on rules
- [ ] **Templates**: Pre-defined removal reasons
- [ ] **Integration**: Connect with violation report system

## Troubleshooting

### Issue: Cannot remove job

**Cause:** Job already has status REMOVED_BY_ADMIN  
**Solution:** Check job status first, already removed jobs cannot be re-removed

### Issue: 403 Forbidden on all endpoints

**Cause:** User is not ADMIN role  
**Solution:** Verify JWT token contains `role: 'ADMIN'`

### Issue: Search returns no results

**Cause:** Search string doesn't match any job title, company, or location  
**Solution:** Try broader search terms or check job status filter

## Dependencies

- `@nestjs/common`: NestJS core framework
- `@nestjs/typeorm`: TypeORM integration
- `typeorm`: ORM for database operations
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation
- `@nestjs/swagger`: API documentation

## Module Registration

```typescript
// app.module.ts
@Module({
  imports: [
    // ... other modules
    AdminJobManagementModule,
  ],
})
export class AppModule {}
```

## Related Modules

- **AuthModule**: Provides JWT authentication
- **JobsModule**: Job-facing operations (create, update, publish)
- **AdminJobApprovalModule**: Approve/reject pending jobs
- **AdminEmployerManagementModule**: Manage employer accounts

## File Structure

```
src/modules/admin-job-management/
├── dto/
│   ├── query-job.dto.ts
│   ├── job-detail.dto.ts
│   ├── remove-job.dto.ts
│   └── index.ts
├── admin-job-management.controller.ts
├── admin-job-management.service.ts
├── admin-job-management.module.ts
├── index.ts
└── README.md
```

## License

Proprietary - TopJob Platform

## Support

For issues or questions, contact the backend development team.
