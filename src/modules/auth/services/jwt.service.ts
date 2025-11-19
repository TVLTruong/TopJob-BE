// src/auth/services/jwt.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from '../../../common/enums';

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

/**
 * JWT Service
 * Handles JWT token generation and verification
 * UC-AUTH-01, UC-AUTH-02
 */
@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access token
   * UC-AUTH-01: Create session after successful login
   */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Verify and decode access token
   * Used in authentication guards
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verify(token);
  }

  /**
   * Get token expiry time in seconds
   */
  getExpiresIn(): number {
    const expiresIn = this.configService.get<string>('jwt.expiresIn', '1h');
    // Convert to seconds
    if (expiresIn.endsWith('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.endsWith('d')) {
      return parseInt(expiresIn) * 86400;
    }
    return parseInt(expiresIn);
  }
}
