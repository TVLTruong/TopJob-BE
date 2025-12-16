/**
 * Current User Decorator
 * Production-grade parameter decorator to extract authenticated user
 *
 * Principles:
 * - Simple data extraction - NO logic
 * - Type-safe with AuthenticatedUser
 * - Supports property selection
 *
 * Requirements:
 * - Must be used in routes protected by JwtAuthGuard
 * - User data is populated by JwtAuthGuard
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/express';

/**
 * Parameter decorator to extract current authenticated user
 *
 * Usage:
 * ```typescript
 * @Controller('profile')
 * @UseGuards(JwtAuthGuard)
 * export class ProfileController {
 *   // Get entire user object
 *   @Get('me')
 *   getProfile(@CurrentUser() user: AuthenticatedUser) {
 *     return user;
 *   }
 *
 *   // Get specific property
 *   @Get('my-id')
 *   getMyId(@CurrentUser('id') userId: string) {
 *     return { userId };
 *   }
 *
 *   @Get('my-role')
 *   getMyRole(@CurrentUser('role') role: UserRole) {
 *     return { role };
 *   }
 * }
 * ```
 *
 * @param data - Optional property key to extract specific field from AuthenticatedUser
 * @returns The entire AuthenticatedUser or specific property value
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ):
    | AuthenticatedUser
    | AuthenticatedUser[keyof AuthenticatedUser]
    | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    // Return specific property if requested
    if (data) {
      return user[data];
    }

    // Return entire user object
    return user;
  },
);
