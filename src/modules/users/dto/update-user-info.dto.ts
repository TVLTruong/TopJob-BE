// src/modules/users/dto/update-user-info.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user account information
 * Used for employer fullName, workTitle, contactEmail, contactPhone
 */
export class UpdateUserInfoDto {
  @ApiProperty({
    description: 'Tên đầy đủ của người liên hệ',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  fullName?: string;

  @ApiProperty({
    description: 'Chức vụ công việc',
    example: 'Quản lý Nhân sự',
  })
  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi ký tự' })
  workTitle?: string;

  @ApiProperty({
    description: 'Email liên hệ',
    example: 'contact@company.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  contactEmail?: string;

  @ApiProperty({
    description: 'Số điện thoại liên hệ',
    example: '0901234567',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{9,11}$/, {
    message: 'Số điện thoại không hợp lệ (9-11 chữ số)',
  })
  contactPhone?: string;

  @ApiProperty({
    description: 'Mã OTP để xác thực thay đổi',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự' })
  otpCode: string;
}

/**
 * DTO for requesting OTP to update user info
 */
export class RequestUpdateInfoOtpDto {
  @ApiProperty({
    description: 'Email của tài khoản (để gửi OTP)',
    example: 'user@company.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
