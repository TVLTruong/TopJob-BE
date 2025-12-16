/**
 * Employer-Only Decorator
 * Syntactic sugar for role-based access control
 *
 * This is a convenience decorator that combines common decorators
 * for employer-only routes without any business logic.
 */

import { applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { UserRole } from '../enums';

/**
 * Decorator to restrict route access to EMPLOYER role only
 *
 * This is syntactic sugar for @Roles(UserRole.EMPLOYER)
 *
 * Usage:
 * ```typescript
 * @Controller('jobs')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class JobsController {
 *   @EmployerOnly()
 *   @Post()
 *   createJob() {}
 * }
 * ```
 *
 * @returns Combined decorators for employer-only access
 */
export const EmployerOnly = () => applyDecorators(Roles(UserRole.EMPLOYER));
