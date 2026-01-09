// src/modules/users/dto/update-email.dto.ts

import { IsNotEmpty, IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating user email with OTP verification
 */
export class UpdateEmailDto {
  @ApiProperty({
    description: 'Địa chỉ email mới',
    example: 'newemail@example.com',
  })
  @IsNotEmpty({ message: 'Email mới không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  newEmail: string;

  @ApiProperty({
    description: 'Mã OTP để xác thực thay đổi',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @IsString({ message: 'Mã OTP phải là chuỗi ký tự' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự' })
  otpCode: string;
}
