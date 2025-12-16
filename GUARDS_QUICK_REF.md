# 🎯 Guards & Decorators - Quick Reference

## Import

```typescript
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Public, Roles, CurrentUser } from '@/common/decorators';
import { UserRole } from '@/common/enums';
import { JwtPayload } from '@/modules/auth/services/jwt.service';
```

## Patterns

### 🔓 Public Route

```typescript
@Get('public')
getData() {}
```

### 🔒 Authenticated Only

```typescript
@Get('private')
@UseGuards(JwtAuthGuard)
getData(@CurrentUser() user: JwtPayload) {}
```

### 👤 Role-Based

```typescript
@Post('create')
@UseGuards(JwtAuthGuard, RolesGuard) // Order matters!
@Roles(UserRole.EMPLOYER)
create(@CurrentUser('sub') userId: string) {}
```

### 🔑 Multiple Roles (OR)

```typescript
@Get('data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.EMPLOYER)
getData() {}
```

### 🏢 Protected Controller

```typescript
@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  @Public() // Override
  @Get('public')
  publicRoute() {}

  @Get('private') // Protected by default
  privateRoute(@CurrentUser() user: JwtPayload) {}
}
```

### 👑 Admin-Only Controller

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {}
```

## Extract User Data

```typescript
// Full object
@CurrentUser() user: JwtPayload

// User ID
@CurrentUser('sub') userId: string

// Email
@CurrentUser('email') email: string

// Role
@CurrentUser('role') role: UserRole

// Status
@CurrentUser('status') status: UserStatus
```

## ⚠️ Rules

1. **Guard Order**: `JwtAuthGuard` → `RolesGuard`
2. **No Business Logic in Guards**: Put in Services
3. **No Hardcoded Roles**: Use `UserRole` enum
4. **Type Safety**: Use `JwtPayload`, `AuthenticatedRequest`

## 📖 Full Guide

See [GUARDS_DECORATORS_GUIDE.md](GUARDS_DECORATORS_GUIDE.md)
