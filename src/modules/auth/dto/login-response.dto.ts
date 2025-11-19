// src/auth/dto/login-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../common/enums';

/**
 * Response DTO for Login (UC-AUTH-01)
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Token expiry time in seconds',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };

  @ApiProperty({
    description: 'Redirect URL based on user status and role',
    example: '/dashboard',
  })
  redirectUrl: string;

  @ApiProperty({
    description: 'Message for user',
    example: 'Đăng nhập thành công!',
  })
  message: string;
}
