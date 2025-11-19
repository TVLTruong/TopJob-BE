// src/auth/dto/verify-email.dto.ts

import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Email Verification (UC-REG-03)
 */
export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'candidate@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({
    description: 'Mã OTP (6 chữ số)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự' })
  otpCode: string;
}

/**
 * Response DTO for Email Verification
 */
export class VerifyEmailResponseDto {
  @ApiProperty({
    description: 'Trạng thái xác thực',
    example: true,
  })
  verified: boolean;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Xác thực email thành công!',
  })
  message: string;

  @ApiProperty({
    description: 'User ID',
    example: '1',
  })
  userId: string;

  @ApiProperty({
    description: 'Email đã xác thực',
    example: 'candidate@example.com',
  })
  email: string;
}

/**
 * DTO for Resending OTP
 */
export class ResendOtpDto {
  @ApiProperty({
    description: 'Email của người dùng',
    example: 'candidate@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;
}
