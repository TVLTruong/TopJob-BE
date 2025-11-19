// src/auth/dto/forgot-password.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPassword } from '../validators/match-password.validator';

/**
 * DTO for Forgot Password Request (UC-AUTH-03 Step 1-2)
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;
}

/**
 * DTO for Reset Password (UC-AUTH-03 Step 9-10)
 * Note: OTP đã được verify ở bước trước thông qua /verify-email
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({
    description:
      'Mật khẩu mới (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)',
    example: 'NewPassword@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Xác nhận mật khẩu mới',
    example: 'NewPassword@123',
  })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  @MatchPassword('newPassword', { message: 'Mật khẩu xác nhận không khớp' })
  confirmNewPassword: string;
}

/**
 * Response DTO for Forgot Password
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Thông báo',
    example: 'Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra email.',
  })
  message: string;

  @ApiProperty({
    description: 'Thời gian hết hạn OTP',
    example: '2025-11-18T10:30:00.000Z',
    required: false,
  })
  expiresAt?: Date;
}
