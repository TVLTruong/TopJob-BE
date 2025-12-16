/**
 * Roles Decorator for RBAC
 * Production-grade decorator for role-based access control
 *
 * Principles:
 * - Simple metadata setter - NO business logic
 * - Type-safe with UserRole enum
 * - Composable with other decorators
 *
 * @see {@link RolesGuard} for authorization logic
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

/**
 * Metadata key for storing required roles
 * Used by RolesGuard to retrieve role requirements
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for route access
 *
 * Usage:
 * ```typescript
 * // Single role
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * adminRoute() {}
 *
 * // Multiple roles (OR logic - user needs ANY of these roles)
 * @Roles(UserRole.ADMIN, UserRole.EMPLOYER)
 * @Get('admin-or-employer')
 * flexibleRoute() {}
 * ```
 *
 * Note: Must be used with RolesGuard
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * ```
 *
 * @param roles - One or more UserRole values
 * @returns MethodDecorator that sets role metadata
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
