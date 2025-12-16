/**
 * Employer Status Guard
 * Business-specific guard for employer status validation
 *
 * Responsibilities:
 * - Check if EMPLOYER users have ACTIVE status
 * - Allow non-EMPLOYER users to pass through
 * - Block EMPLOYER users with non-ACTIVE status
 *
 * Important:
 * - Must be used AFTER JwtAuthGuard and RolesGuard
 * - Only applies business logic for EMPLOYER role
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole, UserStatus } from '../enums';

/**
 * Guard to ensure EMPLOYER users have ACTIVE status
 *
 * Usage:
 * ```typescript
 * @Controller('jobs')
 * @UseGuards(JwtAuthGuard, RolesGuard, EmployerStatusGuard)
 * @Roles(UserRole.EMPLOYER)
 * export class JobsController {
 *   @Post()
 *   createJob() {}
 * }
 * ```
 */
@Injectable()
export class EmployerStatusGuard implements CanActivate {
  /**
   * Validates employer status before allowing access
   * @param context - Execution context containing request information
   * @returns true if user is not employer OR employer with ACTIVE status
   * @throws ForbiddenException if employer has non-ACTIVE status
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Ensure user is authenticated
    if (!request.user) {
      return true; // Let JwtAuthGuard handle authentication
    }

    const { role, status } = request.user;

    // Only check status for EMPLOYER role
    if (role !== UserRole.EMPLOYER) {
      return true; // Allow non-employers to pass
    }

    // EMPLOYER must have ACTIVE status
    if (status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(
        'Tài khoản nhà tuyển dụng chưa được kích hoạt hoặc đã bị khóa',
      );
    }

    return true;
  }
}
