// src/modules/users/dto/delete-account.dto.ts

import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for deleting user account with OTP verification
 */
export class DeleteAccountDto {
  @ApiProperty({
    description: 'Mã OTP để xác thực xóa tài khoản',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự' })
  otpCode: string;

  @ApiProperty({
    description: 'Lý do xóa tài khoản (optional)',
    example: 'Không còn nhu cầu sử dụng',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Lý do phải là chuỗi ký tự' })
  reason?: string;
}
