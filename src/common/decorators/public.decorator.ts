/**
 * Public Decorator
 * Production-grade decorator to bypass authentication
 *
 * Principles:
 * - Simple metadata setter - NO logic
 * - Clear intent for public routes
 * - Works with JwtAuthGuard
 */

import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for public route identification
 * Used by JwtAuthGuard to skip authentication
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as publicly accessible
 *
 * Usage:
 * ```typescript
 * @Controller('auth')
 * @UseGuards(JwtAuthGuard) // Applied globally to controller
 * export class AuthController {
 *   @Public() // This route skips JwtAuthGuard
 *   @Post('login')
 *   login() {}
 *
 *   @Post('logout') // This route requires authentication
 *   logout() {}
 * }
 * ```
 *
 * @returns MethodDecorator that marks route as public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
