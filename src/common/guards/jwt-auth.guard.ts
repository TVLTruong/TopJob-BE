/**
 * JWT Authentication Guard
 * Production-grade authentication guard for NestJS
 *
 * Responsibilities:
 * - Validate JWT token from Authorization header
 * - Attach user payload to request object
 * - Allow public routes to bypass authentication
 *
 * @see {@link https://docs.nestjs.com/guards NestJS Guards}
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../modules/auth/services/jwt.service';
import { AuthenticatedUser } from '../types/express';

/**
 * JWT Authentication Guard
 *
 * Usage:
 * ```typescript
 * @Controller('protected')
 * @UseGuards(JwtAuthGuard)
 * export class ProtectedController {}
 * ```
 *
 * Skip authentication for specific routes:
 * ```typescript
 * @Public()
 * @Get('public-route')
 * publicRoute() {}
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Determines if the current user can activate the route
   * @param context - Execution context containing request information
   * @returns Promise resolving to true if access is granted
   * @throws UnauthorizedException if token is missing or invalid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public using @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token không được cung cấp');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // Map JWT payload to AuthenticatedUser and attach to request
      const user: AuthenticatedUser = {
        id: payload.sub,
        role: payload.role,
        status: payload.status,
      };

      request.user = user;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    return true;
  }

  /**
   * Extracts JWT token from Authorization header
   * @param request - Express request object
   * @returns Token string or undefined if not found
   * @private
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
