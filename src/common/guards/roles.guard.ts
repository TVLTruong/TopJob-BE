/**
 * Role-Based Access Control (RBAC) Guard
 * Production-grade authorization guard for NestJS
 *
 * Responsibilities:
 * - Verify user has required role(s) to access route
 * - NO business logic - only authorization checks
 * - Reusable across all modules
 *
 * Important:
 * - Must be used AFTER JwtAuthGuard in the guards chain
 * - Requires @Roles() decorator to specify required roles
 *
 * @see {@link https://docs.nestjs.com/guards NestJS Guards}
 * @see {@link https://docs.nestjs.com/security/authorization Authorization}
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums';

/**
 * Roles Guard for RBAC
 *
 * Usage:
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard) // Order matters!
 * export class AdminController {
 *   @Roles(UserRole.ADMIN)
 *   @Get('dashboard')
 *   getDashboard() {}
 *
 *   @Roles(UserRole.ADMIN, UserRole.EMPLOYER)
 *   @Get('reports')
 *   getReports() {}
 * }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Determines if the current user has the required role(s)
   * @param context - Execution context containing request information
   * @returns true if user has at least one of the required roles
   * @throws UnauthorizedException if user is not authenticated
   * @throws ForbiddenException if user lacks required role
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, allow access
    // This means the route is protected by auth but not by role
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Ensure user is authenticated (should be guaranteed by JwtAuthGuard)
    if (!request.user) {
      throw new UnauthorizedException(
        'Người dùng chưa được xác thực. Vui lòng thêm JwtAuthGuard trước RolesGuard.',
      );
    }

    // Check if user has at least one of the required roles
    const hasRequiredRole = this.hasAnyRole(request.user.role, requiredRoles);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Yêu cầu quyền: ${this.formatRoles(requiredRoles)}`,
      );
    }

    return true;
  }

  /**
   * Checks if user role matches any of the required roles
   * @param userRole - Current user's role
   * @param requiredRoles - Array of acceptable roles
   * @returns true if user has at least one required role
   * @private
   */
  private hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * Formats role array for error message display
   * @param roles - Array of roles to format
   * @returns Formatted string for user-friendly error message
   * @private
   */
  private formatRoles(roles: UserRole[]): string {
    return roles.join(' hoặc ');
  }
}
