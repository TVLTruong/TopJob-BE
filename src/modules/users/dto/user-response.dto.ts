// src/modules/users/dto/user-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole, UserStatus } from '../../../common/enums';

/**
 * User Response DTO
 */
export class UserResponseDto {
  @ApiProperty({ description: 'ID của user' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Email' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Vai trò', enum: UserRole })
  @Expose()
  role: UserRole;

  @ApiProperty({ description: 'Trạng thái', enum: UserStatus })
  @Expose()
  status: UserStatus;

  @ApiProperty({ description: 'Đã xác thực email' })
  @Expose()
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Thời gian xác thực email' })
  @Expose()
  emailVerifiedAt: Date | null;

  @ApiPropertyOptional({ description: 'Thời gian đăng nhập lần cuối' })
  @Expose()
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Ngày tạo' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  @Expose()
  updatedAt: Date;

  // Profile info based on role
  @ApiPropertyOptional({ description: 'ID profile (candidate hoặc employer)' })
  @Expose()
  profileId?: string;

  @ApiPropertyOptional({ description: 'Họ tên' })
  @Expose()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Hồ sơ đã hoàn thiện' })
  @Expose()
  hasCompleteProfile?: boolean;
}
