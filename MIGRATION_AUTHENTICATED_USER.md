# Migration Guide: AuthenticatedUser Type

## 📋 Thay đổi

### Trước (JwtPayload)

```typescript
import { JwtPayload } from '@/modules/auth/services/jwt.service';

@Get('me')
getMe(@CurrentUser() user: JwtPayload) {
  const userId = user.sub; // ❌ Dùng 'sub'
  const role = user.role;
  const status = user.status;
}
```

### Sau (AuthenticatedUser)

```typescript
import { AuthenticatedUser } from '@/common/types';

@Get('me')
getMe(@CurrentUser() user: AuthenticatedUser) {
  const userId = user.id; // ✅ Dùng 'id'
  const role = user.role;
  const status = user.status;
}
```

## 🔄 Cách migrate

### 1. Thay đổi import

```typescript
// ❌ Cũ
import { JwtPayload } from '@/modules/auth/services/jwt.service';

// ✅ Mới
import { AuthenticatedUser } from '@/common/types';
```

### 2. Thay đổi type annotation

```typescript
// ❌ Cũ
@CurrentUser() user: JwtPayload

// ✅ Mới
@CurrentUser() user: AuthenticatedUser
```

### 3. Thay đổi property access

```typescript
// ❌ Cũ
user.sub; // User ID

// ✅ Mới
user.id; // User ID
```

## 📦 Các field

### AuthenticatedUser

```typescript
{
  id: string; // User ID (trước là 'sub')
  role: UserRole; // Không đổi
  status: UserStatus; // Không đổi
}
```

### JwtPayload (vẫn dùng trong auth service)

```typescript
{
  sub: string;      // User ID
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}
```

## ✅ Files đã cập nhật

- ✅ `src/common/types/express.d.ts` - Global type definition
- ✅ `src/common/guards/jwt-auth.guard.ts` - Map JwtPayload → AuthenticatedUser
- ✅ `src/common/guards/roles.guard.ts` - Sử dụng Request.user
- ✅ `src/common/guards/employer-status.guard.ts` - Sử dụng Request.user
- ✅ `src/common/decorators/current-user.decorator.ts` - Trả về AuthenticatedUser

## 🎯 Controllers cần migrate

Tìm và thay thế:

```bash
# Tìm tất cả usage
grep -r "JwtPayload" src/modules --include="*.controller.ts"

# Các controller cần update:
- src/modules/users/users.controller.ts
- src/modules/jobs/employer-jobs.controller.ts
- src/modules/employers/employers.controller.ts
- ...và các controller khác
```

## 🚀 Usage sau khi migrate

```typescript
import { AuthenticatedUser } from '@/common/types';
import { CurrentUser } from '@/common/decorators';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  // Full user
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      id: user.id,
      role: user.role,
      status: user.status,
    };
  }

  // Extract id
  @Get('my-id')
  getMyId(@CurrentUser('id') userId: string) {
    return { userId };
  }

  // Extract role
  @Get('my-role')
  getMyRole(@CurrentUser('role') role: UserRole) {
    return { role };
  }
}
```

## ⚠️ Lưu ý

1. **JwtPayload vẫn dùng trong Auth module** - Không thay đổi
2. **AuthenticatedUser chỉ dùng trong Controllers/Guards**
3. **Property 'sub' → 'id'** - Đây là thay đổi quan trọng nhất
4. **TypeScript sẽ báo lỗi nếu dùng sai** - Type safety đảm bảo
