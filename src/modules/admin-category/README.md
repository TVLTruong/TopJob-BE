# Admin Category Management Module

## Overview

Domain-driven NestJS module for administrative management of shared categories in the TopJob platform. Supports both JobCategory (hierarchical tree structure) and CompanyCategory (flat industry list) with soft delete capabilities.

## Features

- **Category Types**: Manage JobCategory and CompanyCategory
- **CRUD Operations**: Create, Read, Update with validation
- **Soft Delete**: Hide/Unhide using isActive flag
- **Tree Structure**: JobCategory supports parent-child hierarchy
- **No Data Loss**: Hidden categories don't affect existing data
- **Auto-Update**: Frontend dropdowns filter by isActive

## Supported Category Types

### 1. JobCategory (job_category)

Hierarchical category structure for job posts.

- Supports parent-child relationships (tree structure)
- Examples: IT > Software Development > Backend
- Used in job posting and search

### 2. CompanyCategory (company_category)

Flat list of industry/sector categories.

- No hierarchy, simple list
- Includes optional description field
- Examples: Technology, Finance, Healthcare
- Used in company profiles

## Architecture

### Domain Model

```
Admin manages:
├── JobCategory (Tree Structure)
│   ├── parent_id (nullable)
│   ├── isActive flag
│   └── children[]
│
└── CompanyCategory (Flat List)
    ├── description
    └── isActive flag

Frontend dropdown:
- Queries WHERE isActive = true
- Hidden categories still referenced in old data
```

### Soft Delete Strategy

- **Hide**: Set isActive = false
- **Unhide**: Set isActive = true
- **No Hard Delete**: Preserve data integrity
- **Old Data Safe**: Existing jobs/companies unaffected

## API Endpoints

### 1. Get Category List

```http
GET /admin/categories?type={type}&isActive={boolean}&search={keyword}
Authorization: Bearer {admin_token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | CategoryType | Yes | job_category or company_category |
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 10) |
| search | string | No | Search in name or slug |
| isActive | boolean | No | Filter by active status |
| sortBy | string | No | Sort field (default: createdAt) |
| sortOrder | ASC\|DESC | No | Sort direction (default: DESC) |

**Response:**

```typescript
{
  "data": [
    {
      "id": "123",
      "name": "Software Development",
      "slug": "software-development",
      "isActive": true,
      "parentId": "100",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z",
      "parent": {
        "id": "100",
        "name": "Information Technology",
        "slug": "information-technology"
      },
      "children": [
        {
          "id": "124",
          "name": "Backend Development",
          "slug": "backend-development"
        }
      ]
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 2. Get Category Detail

```http
GET /admin/categories/:id?type={type}
Authorization: Bearer {admin_token}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | CategoryType | Yes | job_category or company_category |

**Response (JobCategory):**

```typescript
{
  "id": "123",
  "name": "Software Development",
  "slug": "software-development",
  "isActive": true,
  "parentId": "100",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "parent": {
    "id": "100",
    "name": "Information Technology"
  },
  "children": [
    { "id": "124", "name": "Backend Development" },
    { "id": "125", "name": "Frontend Development" }
  ]
}
```

**Response (CompanyCategory):**

```typescript
{
  "id": "456",
  "name": "Technology",
  "slug": "technology",
  "description": "Companies in technology and software industry",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z"
}
```

### 3. Create Category

```http
POST /admin/categories
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "type": "job_category",
  "name": "Backend Development",
  "slug": "backend-development",
  "parentId": "123"
}
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | CategoryType | Yes | job_category or company_category |
| name | string | Yes | Category name (2-255 chars) |
| slug | string | Yes | Unique slug (2-255 chars) |
| description | string | No | Description (CompanyCategory only) |
| parentId | string | No | Parent ID (JobCategory only) |

**Business Rules:**

- Slug must be unique within category type
- parentId must exist if provided (JobCategory)
- description only used for CompanyCategory
- isActive automatically set to true

**Response:**

```typescript
{
  "message": "Tạo category thành công",
  "category": {
    "id": "127",
    "name": "Backend Development",
    "slug": "backend-development",
    "isActive": true,
    "parentId": "123",
    "createdAt": "2024-01-20T00:00:00.000Z"
  }
}
```

### 4. Update Category

```http
PUT /admin/categories/:id?type={type}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Backend Engineering",
  "slug": "backend-engineering",
  "description": "Updated description"
}
```

**Updateable Fields:**
| Field | Type | Validation |
|-------|------|------------|
| name | string | 2-255 chars, optional |
| slug | string | 2-255 chars, unique, optional |
| description | string | CompanyCategory only, optional |

**Protected Fields (Cannot Update):**

- id, type, parentId, isActive
- createdAt, updatedAt (auto-managed)

**Response:**

```typescript
{
  "message": "Cập nhật category thành công",
  "category": {
    "id": "127",
    "name": "Backend Engineering",
    "slug": "backend-engineering",
    "isActive": true
  }
}
```

### 5. Hide Category

```http
POST /admin/categories/:id/hide?type={type}
Authorization: Bearer {admin_token}
```

**Business Rules:**

- Sets isActive = false
- Category hidden from frontend dropdown
- Existing data (jobs, companies) unaffected
- Can be unhidden later

**Response:**

```typescript
{
  "message": "Ẩn category thành công",
  "categoryId": "127",
  "isActive": false
}
```

**Response (Already Hidden):**

```typescript
{
  "statusCode": 400,
  "message": "Danh mục đã bị ẩn trước đó",
  "error": "Bad Request"
}
```

### 6. Unhide Category

```http
POST /admin/categories/:id/unhide?type={type}
Authorization: Bearer {admin_token}
```

**Business Rules:**

- Sets isActive = true
- Category visible in frontend dropdown again
- All data remains intact

**Response:**

```typescript
{
  "message": "Hiện lại category thành công",
  "categoryId": "127",
  "isActive": true
}
```

## Technical Implementation

### Service Layer

**File:** `admin-category.service.ts`

**Key Methods:**

```typescript
async getCategoryList(query: QueryCategoryDto): Promise<PaginationResponseDto<any>>
async getCategoryDetail(id: string, type: CategoryType): Promise<any>
async createCategory(dto: CreateCategoryDto): Promise<any>
async updateCategory(id: string, type: CategoryType, dto: UpdateCategoryDto): Promise<any>
async hideCategory(id: string, type: CategoryType): Promise<void>
async unhideCategory(id: string, type: CategoryType): Promise<void>
```

**Transaction Handling:**

- Uses `QueryRunner` for transaction management
- Pessimistic write locks for updates
- Slug uniqueness validation

### Controller Layer

**File:** `admin-category.controller.ts`

**Protection:**

- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(UserRole.ADMIN)`
- All endpoints require admin authentication

**Swagger Documentation:**

- `@ApiTags('Admin - Category Management')`
- `@ApiQuery` for type parameter
- Comprehensive error response documentation

### DTOs (Data Transfer Objects)

#### QueryCategoryDto

```typescript
class QueryCategoryDto extends PaginationDto {
  @IsEnum(CategoryType)
  type?: CategoryType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEnum(['createdAt', 'name', 'slug'])
  sortBy?: 'createdAt' | 'name' | 'slug';

  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
```

#### CreateCategoryDto

```typescript
class CreateCategoryDto {
  @IsEnum(CategoryType)
  type: CategoryType;

  @IsString()
  @Length(2, 255)
  name: string;

  @IsString()
  @Length(2, 255)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
```

#### UpdateCategoryDto

```typescript
class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 255)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

## Database Entities

### JobCategory Entity

```typescript
@Entity('jobs_categories')
@Tree('closure-table')
class JobCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column('bigint', { nullable: true })
  parentId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: true })
  isActive: boolean;

  @TreeParent()
  parent: JobCategory | null;

  @TreeChildren()
  children: JobCategory[];

  @OneToMany(() => Job, (job) => job.category)
  jobs: Job[];
}
```

### CompanyCategory Entity

```typescript
@Entity('companies_categories')
class CompanyCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;
}
```

## Business Rules

### 1. Category Visibility

- **isActive = true**: Visible in frontend dropdown
- **isActive = false**: Hidden from dropdown, but data preserved
- Frontend queries: `WHERE isActive = true`

### 2. Soft Delete Strategy

- No hard delete to preserve data integrity
- Old jobs/companies still reference hidden categories
- Admin can restore hidden categories anytime

### 3. Slug Uniqueness

- Slug must be unique within category type
- JobCategory and CompanyCategory can have same slug
- Validation on create and update

### 4. Tree Structure (JobCategory)

- Supports parent-child hierarchy
- parentId can be null (root category)
- Parent must exist if parentId provided

### 5. Immutable Fields

- type: Cannot change after creation
- parentId: Cannot change after creation (JobCategory)
- isActive: Only changed via hide/unhide endpoints

## Error Handling

### Common Errors

| Status Code | Error        | Cause                                 |
| ----------- | ------------ | ------------------------------------- |
| 400         | Bad Request  | Type missing, already hidden/unhidden |
| 401         | Unauthorized | Missing or invalid JWT token          |
| 403         | Forbidden    | Non-admin user attempting access      |
| 404         | Not Found    | Category ID does not exist            |
| 409         | Conflict     | Slug already exists                   |

### Error Response Format

```typescript
{
  "statusCode": 409,
  "message": "Slug \"software-dev\" đã tồn tại trong JobCategory",
  "error": "Conflict"
}
```

## Frontend Integration

### Dropdown Query Example

```typescript
// Frontend fetches active categories only
GET /api/categories?type=job_category&isActive=true&limit=100

// Result: Only active categories shown in dropdown
// Hidden categories don't appear in new job/company forms
```

### Old Data Handling

```typescript
// Old job still shows its category even if hidden
GET /api/jobs/123

{
  "id": "123",
  "title": "Senior Developer",
  "category": {
    "id": "999",
    "name": "Deprecated Category",
    "slug": "deprecated-category",
    "isActive": false  // Hidden, but still referenced
  }
}
```

## Usage Examples

### Example 1: Create JobCategory with Parent

```bash
curl -X POST "http://localhost:3000/admin/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "job_category",
    "name": "Machine Learning",
    "slug": "machine-learning",
    "parentId": "100"
  }'
```

### Example 2: Hide Outdated Category

```bash
curl -X POST "http://localhost:3000/admin/categories/456/hide?type=company_category" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Example 3: Search Active Categories

```bash
curl -X GET "http://localhost:3000/admin/categories?type=job_category&isActive=true&search=software" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Example 4: Update Category Name

```bash
curl -X PUT "http://localhost:3000/admin/categories/789?type=job_category" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full-Stack Development",
    "slug": "full-stack-development"
  }'
```

## Logging

### Service-Level Logging

```typescript
Logger.log(`Created JobCategory: ${id} - ${name}`);
Logger.log(`Hidden CompanyCategory: ${id} - ${name}`);
Logger.log(`Updated JobCategory: ${id}`);
Logger.error(`Error in createCategory: ${error.message}`, error.stack);
```

### What Gets Logged

- Category creation with ID and name
- Hide/unhide actions
- Update operations
- Error details with stack traces

## TODO / Future Enhancements

### High Priority

- [ ] **Batch Operations**: Hide/unhide multiple categories at once
- [ ] **Usage Statistics**: Count jobs/companies using each category
- [ ] **Category Merge**: Merge two categories and update references
- [ ] **Import/Export**: CSV import/export for bulk management

### Medium Priority

- [ ] **Category Icons**: Add icon URLs for better UI
- [ ] **Display Order**: Custom sorting order for frontend
- [ ] **Metadata**: Additional fields (color, priority, etc.)
- [ ] **Audit Trail**: Log all category changes

### Low Priority

- [ ] **Multi-language**: Support category names in multiple languages
- [ ] **Auto-slug**: Generate slug from name automatically
- [ ] **Validation Rules**: Custom validation per category type

## Troubleshooting

### Issue: Cannot create category with existing slug

**Cause:** Slug already exists in the same category type  
**Solution:** Use a different slug or update existing category

### Issue: 400 Bad Request when creating JobCategory with parentId

**Cause:** Parent category doesn't exist  
**Solution:** Verify parent ID exists and is a JobCategory

### Issue: Category still appears in dropdown after hiding

**Cause:** Frontend cache not refreshed  
**Solution:** Frontend should re-fetch on category changes or clear cache

## Dependencies

- `@nestjs/common`: NestJS core framework
- `@nestjs/typeorm`: TypeORM integration
- `typeorm`: ORM with tree repository support
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation
- `@nestjs/swagger`: API documentation

## Module Registration

```typescript
// app.module.ts
@Module({
  imports: [
    // ... other modules
    AdminCategoryModule,
  ],
})
export class AppModule {}
```

## Related Modules

- **AuthModule**: Provides JWT authentication
- **JobsModule**: Uses JobCategory for job posts
- **CompaniesModule**: Uses CompanyCategory for company profiles
- **CategoriesModule**: Public API for category listing

## File Structure

```
src/modules/admin-category/
├── dto/
│   ├── query-category.dto.ts
│   ├── create-category.dto.ts
│   ├── update-category.dto.ts
│   └── index.ts
├── admin-category.controller.ts
├── admin-category.service.ts
├── admin-category.module.ts
├── index.ts
└── README.md
```

## License

Proprietary - TopJob Platform

## Support

For issues or questions, contact the backend development team.
