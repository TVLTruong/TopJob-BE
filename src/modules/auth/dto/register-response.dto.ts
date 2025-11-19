// src/auth/dto/register-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserRole } from '../../../common/enums';

/**
 * Response DTO for Registration (UC-REG-01)
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '1',
  })
  userId: string;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'candidate@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Vai trò của người dùng',
    enum: UserRole,
    example: UserRole.CANDIDATE,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Trạng thái tài khoản',
    enum: UserStatus,
    example: UserStatus.PENDING_EMAIL_VERIFICATION,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Thông báo hướng dẫn',
    example:
      'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
  })
  message: string;

  @ApiProperty({
    description: 'Thời gian hết hạn của OTP (timestamp)',
    example: '2025-11-18T10:30:00.000Z',
  })
  otpExpiresAt: Date;
}
