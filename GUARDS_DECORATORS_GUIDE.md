# Guards & Decorators - Production Guide

## 📋 Tổng quan

Hệ thống Authentication & Authorization production-grade cho NestJS, tuân thủ các nguyên tắc:

✅ **Không hardcode role** - Sử dụng enum  
✅ **Guard chỉ kiểm tra quyền** - Không xử lý nghiệp vụ  
✅ **Exception chuẩn NestJS** - UnauthorizedException, ForbiddenException  
✅ **Tái sử dụng cao** - Áp dụng cho tất cả modules  
✅ **Decorator đơn giản** - Chỉ set metadata, không logic

---

## 🛡️ Guards

### 1. JwtAuthGuard

**Trách nhiệm:**

- Xác thực JWT token
- Attach user payload vào request
- Cho phép public routes bypass

**Sử dụng:**

```typescript
// Bảo vệ toàn bộ controller
@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @Get('data')
  getData() {
    // Route này yêu cầu authentication
  }
}

// Bảo vệ một route cụ thể
@Controller('mixed')
export class MixedController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protectedRoute() {}

  @Get('public')
  publicRoute() {}
}
```

### 2. RolesGuard

**Trách nhiệm:**

- Kiểm tra user có role phù hợp
- KHÔNG xử lý nghiệp vụ
- Chỉ throw exception nếu thiếu quyền

**⚠️ Quan trọng:** Phải đặt SAU JwtAuthGuard

**Sử dụng:**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Thứ tự quan trọng!
export class AdminController {
  // Chỉ ADMIN
  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  getDashboard() {}

  // ADMIN HOẶC EMPLOYER (OR logic)
  @Roles(UserRole.ADMIN, UserRole.EMPLOYER)
  @Get('reports')
  getReports() {}

  // Authenticated nhưng không check role
  @Get('common')
  commonRoute() {}
}
```

---

## 🎨 Decorators

### 1. @Public()

Bỏ qua authentication cho route cụ thể.

```typescript
@Controller('auth')
@UseGuards(JwtAuthGuard) // Global cho controller
export class AuthController {
  @Public() // Skip authentication
  @Post('login')
  login() {}

  @Public()
  @Post('register')
  register() {}

  @Post('logout') // Yêu cầu authentication
  logout() {}
}
```

### 2. @Roles()

Chỉ định role cần thiết cho route.

```typescript
// Single role
@Roles(UserRole.ADMIN)
@Delete(':id')
deleteUser() {}

// Multiple roles (OR logic)
@Roles(UserRole.ADMIN, UserRole.EMPLOYER)
@Get('analytics')
getAnalytics() {}
```

### 3. @CurrentUser()

Extract thông tin user đã xác thực từ request.

```typescript
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  // Lấy toàn bộ user object
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return user;
  }

  // Lấy property cụ thể
  @Get('my-id')
  getMyId(@CurrentUser('sub') userId: string) {
    return { userId };
  }

  @Get('my-role')
  getMyRole(@CurrentUser('role') role: UserRole) {
    return { role };
  }

  @Get('my-email')
  getMyEmail(@CurrentUser('email') email: string) {
    return { email };
  }
}
```

---

## 🏗️ Patterns thực tế

### Pattern 1: Public Controller với vài Protected Routes

```typescript
@Controller('jobs')
export class JobsController {
  // Public - Xem danh sách jobs
  @Get()
  findAll() {}

  // Public - Xem chi tiết job
  @Get(':id')
  findOne(@Param('id') id: string) {}

  // Protected - Tạo job (chỉ EMPLOYER)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {}

  // Protected - Sửa job (chỉ EMPLOYER)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.EMPLOYER)
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateJobDto,
  ) {}
}
```

### Pattern 2: Protected Controller với Public Endpoint

```typescript
@Controller('candidates')
@UseGuards(JwtAuthGuard) // Global protection
export class CandidatesController {
  @Public() // Override global guard
  @Get('search')
  search(@Query() query: SearchDto) {}

  // Protected - chỉ authenticated users
  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {}

  // Protected với role check
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {}
}
```

### Pattern 3: Admin-Only Controller

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // Apply to entire controller
export class AdminController {
  @Get('users')
  getAllUsers() {}

  @Get('statistics')
  getStats() {}

  // Override với nhiều roles hơn
  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.EMPLOYER)
  getReports() {}
}
```

### Pattern 4: Resource Ownership Check (trong Service/UseCase)

```typescript
// ❌ KHÔNG làm trong Guard
// ✅ Làm trong Service/UseCase

@Injectable()
export class JobsService {
  async update(jobId: string, userId: string, dto: UpdateJobDto) {
    const job = await this.findOne(jobId);

    // Business logic: Check ownership
    if (job.employerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa job này');
    }

    return this.jobRepository.update(jobId, dto);
  }
}
```

---

## 🎯 Best Practices

### 1. Guard Order

```typescript
// ✅ ĐÚNG
@UseGuards(JwtAuthGuard, RolesGuard)

// ❌ SAI - RolesGuard cần user từ JwtAuthGuard
@UseGuards(RolesGuard, JwtAuthGuard)
```

### 2. Role-based Logic

```typescript
// ✅ ĐÚNG - Guard chỉ check quyền
@Roles(UserRole.EMPLOYER)
@Post('jobs')
create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
  return this.jobsService.create(user.sub, dto);
}

// ❌ SAI - Không hardcode role
@Post('jobs')
create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
  if (user.role !== 'employer') {
    throw new ForbiddenException();
  }
  return this.jobsService.create(user.sub, dto);
}
```

### 3. Business Logic Placement

```typescript
// ✅ ĐÚNG - Business logic trong Service
@Injectable()
export class JobsService {
  async deleteJob(jobId: string, userId: string) {
    const job = await this.findOne(jobId);

    // Business rule: Only owner can delete
    if (job.employerId !== userId) {
      throw new ForbiddenException('Không có quyền xóa job này');
    }

    return this.jobRepository.delete(jobId);
  }
}

// ❌ SAI - Business logic trong Guard
@Injectable()
export class JobOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    // Không nên có business logic ở đây
    const job = await this.jobService.findOne(jobId);
    return job.employerId === userId;
  }
}
```

### 4. Type Safety

```typescript
// ✅ ĐÚNG - Sử dụng typed request
import { AuthenticatedRequest } from '@/common/types';

@Controller('profile')
export class ProfileController {
  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    // user is typed correctly
    return { id: user.sub, email: user.email };
  }
}

// ❌ SAI - Sử dụng any
@Get('me')
getProfile(@Request() req: any) {
  return req.user; // No type safety
}
```

---

## 🔍 Error Handling

### Authentication Errors (JwtAuthGuard)

```typescript
// Token missing
throw new UnauthorizedException('Token không được cung cấp');

// Token invalid
throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
```

### Authorization Errors (RolesGuard)

```typescript
// User not authenticated (missing JwtAuthGuard)
throw new UnauthorizedException(
  'Người dùng chưa được xác thực. Vui lòng thêm JwtAuthGuard trước RolesGuard.',
);

// Insufficient permissions
throw new ForbiddenException('Yêu cầu quyền: admin hoặc employer');
```

---

## 📦 Type Definitions

### AuthenticatedRequest

```typescript
import { AuthenticatedRequest } from '@/common/types';

// Use trong custom guards/interceptors
@Injectable()
export class CustomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // request.user is typed as JwtPayload
    return request.user.role === UserRole.ADMIN;
  }
}
```

### JwtPayload

```typescript
interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: UserRole; // User role
  status: UserStatus; // User status
  iat?: number; // Issued at
  exp?: number; // Expires at
}
```

---

## 🧪 Testing

### Unit Testing Guards

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockExecutionContext({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    const context = createMockExecutionContext({
      user: { role: UserRole.CANDIDATE },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

---

## 🚀 Migration từ code cũ

```typescript
// ❌ CŨ
interface RequestWithUser extends Request {
  user?: JwtPayload;
}

// ✅ MỚI
import { AuthenticatedRequest } from '@/common/types';

// ❌ CŨ
const request = context.switchToHttp().getRequest<RequestWithUser>();
if (!request.user) {
  throw new ForbiddenException();
}

// ✅ MỚI
const request = context.switchToHttp().getRequest();
if (!isAuthenticated(request)) {
  throw new UnauthorizedException();
}
```

---

## 📚 References

- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types)
