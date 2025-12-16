/**
 * Active Employer Decorator
 * Convenience decorator for employer-only routes with status validation
 *
 * This decorator combines authentication, authorization, and status checks
 * for employer-only routes without any business logic.
 */

import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { EmployerStatusGuard } from '../guards/employer-status.guard';
import { EmployerOnly } from './employer-only.decorator';

/**
 * Decorator to restrict route access to ACTIVE EMPLOYER only
 *
 * This combines:
 * - Authentication (JwtAuthGuard)
 * - Role check (RolesGuard + @EmployerOnly)
 * - Status validation (EmployerStatusGuard)
 *
 * Usage:
 * ```typescript
 * @Controller('jobs')
 * export class JobsController {
 *   @ActiveEmployer()
 *   @Post()
 *   createJob(@CurrentUser() user: JwtPayload) {
 *     // Only active employers can access
 *   }
 * }
 * ```
 *
 * Equivalent to:
 * ```typescript
 * @UseGuards(JwtAuthGuard, RolesGuard, EmployerStatusGuard)
 * @EmployerOnly()
 * ```
 *
 * @returns Combined decorators for active employer access
 */
export const ActiveEmployer = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard, EmployerStatusGuard),
    EmployerOnly(),
  );
