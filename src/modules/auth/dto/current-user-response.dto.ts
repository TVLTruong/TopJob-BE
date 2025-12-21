// src/modules/auth/dto/current-user-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../common/enums';

/**
 * Response DTO for Get Current User
 * Used for testing and debugging to check current user's role
 */
export class CurrentUserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: 'Email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CANDIDATE,
  })
  role: UserRole;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Token issued at (timestamp)',
    example: 1703068800,
  })
  iat: number;

  @ApiProperty({
    description: 'Token expires at (timestamp)',
    example: 1703155200,
  })
  exp: number;
}
