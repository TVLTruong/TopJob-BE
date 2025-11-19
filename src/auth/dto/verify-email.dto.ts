// src/auth/dto/verify-email.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OtpPurpose } from '../../common/enums';

/**
 * DTO for Email/OTP Verification
 * UC-REG-03: Verify registration email
 * UC-AUTH-03: Verify forgot password OTP
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

  @ApiProperty({
    description: 'Mục đích xác thực OTP',
    enum: OtpPurpose,
    example: OtpPurpose.EMAIL_VERIFICATION,
    required: false,
    default: OtpPurpose.EMAIL_VERIFICATION,
  })
  @IsOptional()
  @IsEnum(OtpPurpose, { message: 'Mục đích OTP không hợp lệ' })
  purpose?: OtpPurpose;
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
