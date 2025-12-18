# Admin Candidate Management Module

## Overview

Domain-driven NestJS module for administrative management of candidate accounts in the TopJob platform. Provides comprehensive candidate management capabilities including account status control, information updates, and application tracking.

## Features

- **Candidate List**: Paginated list with advanced search and status filtering
- **Detailed View**: Complete candidate profile with application statistics
- **Account Control**: Ban/unban candidate accounts with reason tracking
- **Information Update**: Admin-controlled updates to candidate basic information
- **Safe Deletion**: Delete candidates with application validation
- **Application Tracking**: View candidate's application history and statistics

## Architecture

### Domain Model

```
User (1) ─────has─────> (1) Candidate
Candidate (1) ───has───> (n) Application
Admin performs action → User status changes
```

### Transaction Boundaries

- **Ban/Unban**: Single transaction, pessimistic lock on user
- **Update**: Single transaction, updates both User and Candidate
- **Delete**: Transaction with cascade delete validation

## API Endpoints

### 1. Get Candidate List

```http
GET /admin/candidates
Authorization: Bearer {admin_token}
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number (1-based) | 1 |
| limit | number | Items per page (1-100) | 10 |
| search | string | Search in name, email, phone | - |
| status | UserStatus | Filter by account status | - |
| sortBy | string | Sort field | createdAt |
| sortOrder | ASC\|DESC | Sort direction | DESC |

**Response:**

```typescript
{
  "data": [
    {
      "id": "uuid",
      "email": "candidate@example.com",
      "fullName": "Nguyen Van A",
      "phoneNumber": "0901234567",
      "role": "CANDIDATE",
      "status": "ACTIVE",
      "avatarUrl": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "candidate": {
        "id": "uuid",
        "totalApplications": 15,
        "pendingApplications": 3
      }
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 2. Get Candidate Detail

```http
GET /admin/candidates/:id
Authorization: Bearer {admin_token}
```

**Response:**

```typescript
{
  "id": "uuid",
  "email": "candidate@example.com",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0901234567",
  "role": "CANDIDATE",
  "status": "ACTIVE",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "candidate": {
    "id": "uuid",
    "userId": "uuid",
    "bio": "Experienced software developer...",
    "skills": ["JavaScript", "TypeScript", "NestJS"],
    "experience": "5 years in web development",
    "education": "Bachelor of Computer Science",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z",
    "applications": [
      {
        "id": "uuid",
        "jobId": "uuid",
        "status": "PENDING",
        "createdAt": "2024-01-10T00:00:00.000Z"
      }
    ]
  }
}
```

### 3. Ban Candidate

```http
POST /admin/candidates/:id/ban
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Spam applications or inappropriate behavior"
}
```

**Business Rules:**

- Candidate must exist and be ACTIVE
- Admin cannot ban themselves
- Status changes: ACTIVE → BANNED
- All active job applications are auto-rejected

**Response:**

```typescript
{
  "message": "Candidate banned successfully",
  "candidate": {
    "id": "uuid",
    "email": "candidate@example.com",
    "status": "BANNED"
  }
}
```

### 4. Unban Candidate

```http
POST /admin/candidates/:id/unban
Authorization: Bearer {admin_token}
```

**Business Rules:**

- Candidate must exist and be BANNED
- Status changes: BANNED → ACTIVE
- Candidate can immediately apply to jobs again

**Response:**

```typescript
{
  "message": "Candidate unbanned successfully",
  "candidate": {
    "id": "uuid",
    "email": "candidate@example.com",
    "status": "ACTIVE"
  }
}
```

### 5. Update Candidate Information

```http
PUT /admin/candidates/:id
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "fullName": "Nguyen Van B",
  "phoneNumber": "0912345678",
  "avatarUrl": "https://new-avatar-url.com/image.jpg"
}
```

**Updateable Fields:**
| Field | Type | Validation |
|-------|------|------------|
| fullName | string | 1-100 chars, optional |
| phoneNumber | string | Vietnamese phone format, optional |
| avatarUrl | string | Valid URL, optional |

**Protected Fields (Cannot Update):**

- id, email, role, status, password
- createdAt, updatedAt (auto-managed)

**Response:**

```typescript
{
  "message": "Candidate updated successfully",
  "candidate": {
    "id": "uuid",
    "email": "candidate@example.com",
    "fullName": "Nguyen Van B",
    "phoneNumber": "0912345678",
    "avatarUrl": "https://new-avatar-url.com/image.jpg"
  }
}
```

### 6. Delete Candidate

```http
DELETE /admin/candidates/:id
Authorization: Bearer {admin_token}
```

**Business Rules:**

- Candidate must exist
- Admin cannot delete themselves
- Validation: Cannot delete if candidate has any applications
- Cascade deletes: User → Candidate (via onDelete: CASCADE)

**Response (Success):**

```typescript
{
  "message": "Candidate deleted successfully"
}
```

**Response (Has Applications):**

```typescript
{
  "statusCode": 400,
  "message": "Cannot delete candidate with existing applications. Found 5 applications.",
  "error": "Bad Request"
}
```

## Technical Implementation

### Service Layer

**File:** `admin-candidate-management.service.ts`

**Key Methods:**

```typescript
async getCandidateList(query: QueryCandidateDto): Promise<PaginationResponseDto<any>>
async getCandidateDetail(id: string): Promise<any>
async banCandidate(id: string, adminId: string, dto: BanCandidateDto): Promise<void>
async unbanCandidate(id: string, adminId: string): Promise<void>
async updateCandidate(id: string, dto: UpdateCandidateDto): Promise<User>
async deleteCandidate(id: string, adminId: string): Promise<void>
```

**Transaction Handling:**

- Uses `@Transactional()` decorator for data consistency
- Pessimistic write locks: `lock: { mode: 'pessimistic_write' }`
- Prevents race conditions on concurrent admin actions

### Controller Layer

**File:** `admin-candidate-management.controller.ts`

**Protection:**

- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(UserRole.ADMIN)`
- All endpoints require admin authentication

**Swagger Documentation:**

- `@ApiTags('Admin - Candidate Management')`
- Detailed `@ApiOperation`, `@ApiParam`, `@ApiResponse` annotations
- Comprehensive error response documentation

### DTOs (Data Transfer Objects)

#### QueryCandidateDto

```typescript
class QueryCandidateDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(['createdAt', 'fullName', 'email'])
  sortBy?: 'createdAt' | 'fullName' | 'email';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
```

#### BanCandidateDto

```typescript
class BanCandidateDto {
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  reason: string;
}
```

#### UpdateCandidateDto

```typescript
class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
```

## Database Entities

### User Entity

```typescript
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @OneToOne(() => Candidate, (candidate) => candidate.user, { cascade: true })
  candidate: Candidate;
}
```

### Candidate Entity

```typescript
@Entity('candidates')
class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @OneToOne(() => User, (user) => user.candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Application, (application) => application.candidate)
  applications: Application[];
}
```

### Application Entity

```typescript
@Entity('applications')
class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Candidate, (candidate) => candidate.applications)
  candidate: Candidate;

  @Column({ type: 'enum', enum: ApplicationStatus })
  status: ApplicationStatus;
}
```

## Business Rules

### 1. Account Status Management

- **ACTIVE**: Can apply to jobs, full platform access
- **BANNED**: Cannot apply, existing applications rejected
- **INACTIVE**: Soft-deleted or deactivated by user

### 2. Self-Protection Rules

- Admin cannot ban themselves
- Admin cannot delete themselves
- Prevents accidental admin lockout

### 3. Application Constraints

- Cannot delete candidate with active applications
- Banning candidate auto-rejects all pending applications
- Unbanning restores full application capabilities

### 4. Data Integrity

- Transaction-safe operations
- Pessimistic locking prevents race conditions
- Cascade delete maintains referential integrity

## Error Handling

### Common Errors

| Status Code | Error        | Cause                                     |
| ----------- | ------------ | ----------------------------------------- |
| 400         | Bad Request  | Invalid input, validation failed          |
| 401         | Unauthorized | Missing or invalid JWT token              |
| 403         | Forbidden    | Non-admin user attempting access          |
| 404         | Not Found    | Candidate ID does not exist               |
| 409         | Conflict     | Cannot delete candidate with applications |

### Error Response Format

```typescript
{
  "statusCode": 400,
  "message": "Validation failed",
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

### Input Validation

- All DTOs use class-validator decorators
- Phone number regex for Vietnamese format
- URL validation for avatar links
- Length constraints on text fields

## Testing

### Unit Testing

```bash
# Test service layer
npm run test -- admin-candidate-management.service.spec.ts

# Test controller layer
npm run test -- admin-candidate-management.controller.spec.ts
```

### E2E Testing

```bash
# Test full API flow
npm run test:e2e -- admin-candidate-management.e2e-spec.ts
```

### Test Coverage

- Service methods: Business logic validation
- Controller endpoints: Request/response flow
- DTOs: Validation rules
- Guards: Authentication and authorization

## Usage Examples

### Example 1: Search Active Candidates

```bash
curl -X GET "http://localhost:3000/admin/candidates?status=ACTIVE&search=nguyen&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Example 2: Ban Spammer

```bash
curl -X POST "http://localhost:3000/admin/candidates/uuid-123/ban" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Submitting spam applications repeatedly"}'
```

### Example 3: Update Contact Info

```bash
curl -X PUT "http://localhost:3000/admin/candidates/uuid-123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0912345678","fullName":"Updated Name"}'
```

### Example 4: Delete Inactive Candidate

```bash
curl -X DELETE "http://localhost:3000/admin/candidates/uuid-123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Logging

### Service-Level Logging

```typescript
Logger.log(`Admin ${adminId} banned candidate ${id}`);
Logger.log(`Admin ${adminId} unbanned candidate ${id}`);
Logger.log(`Admin ${adminId} updated candidate ${id}`);
Logger.log(`Admin ${adminId} deleted candidate ${id}`);
Logger.error(`Error in getCandidateList: ${error.message}`, error.stack);
```

### What Gets Logged

- Admin actions (ban, unban, update, delete)
- Error details with stack traces
- Query parameters for list operations
- Validation failures

## TODO / Future Enhancements

### High Priority

- [ ] **Email Notifications**: Notify candidates when banned/unbanned
- [ ] **Audit Trail**: Log all admin actions to audit table
- [ ] **Soft Delete**: Implement soft delete instead of hard delete
- [ ] **Batch Operations**: Ban/unban multiple candidates at once

### Medium Priority

- [ ] **Export**: Export candidate list to CSV/Excel
- [ ] **Advanced Filters**: Filter by registration date range, application count
- [ ] **Activity History**: View candidate's platform activity timeline
- [ ] **Profile Verification**: Mark candidates as verified

### Low Priority

- [ ] **Statistics Dashboard**: Candidate growth, ban rates
- [ ] **Custom Fields**: Allow admin to add custom metadata
- [ ] **Integration**: Connect with external background check services

## Troubleshooting

### Issue: Cannot delete candidate

**Cause:** Candidate has existing applications  
**Solution:** Check applications first, decide to soft-delete or contact candidate

### Issue: 403 Forbidden on all endpoints

**Cause:** User is not ADMIN role  
**Solution:** Verify JWT token contains `role: 'ADMIN'`

### Issue: Phone number validation fails

**Cause:** Invalid Vietnamese phone format  
**Solution:** Use format: 0901234567 or +84901234567

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
    AdminCandidateManagementModule,
  ],
})
export class AppModule {}
```

## Related Modules

- **AuthModule**: Provides JWT authentication
- **UsersModule**: Base user management
- **CandidatesModule**: Candidate-facing operations
- **ApplicationsModule**: Job application management
- **AdminEmployerManagementModule**: Similar pattern for employers

## File Structure

```
src/modules/admin-candidate-management/
├── dto/
│   ├── query-candidate.dto.ts
│   ├── candidate-detail.dto.ts
│   ├── ban-candidate.dto.ts
│   ├── update-candidate.dto.ts
│   └── index.ts
├── admin-candidate-management.controller.ts
├── admin-candidate-management.service.ts
├── admin-candidate-management.module.ts
├── index.ts
└── README.md
```

## License

Proprietary - TopJob Platform

## Support

For issues or questions, contact the backend development team.
