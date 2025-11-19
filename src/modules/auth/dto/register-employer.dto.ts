// src/auth/dto/register-employer.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPassword } from '../validators/match-password.validator';

/**
 * DTO for Employer Registration (UC-REG-02)
 */
export class RegisterEmployerDto {
  @ApiProperty({
    description: 'Họ và tên người đại diện',
    example: 'Nguyễn Văn B',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullName: string;

  @ApiProperty({
    description: 'Chức vụ của người đại diện',
    example: 'Giám đốc Nhân sự',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi ký tự' })
  workTitle?: string;

  @ApiProperty({
    description: 'Email công ty',
    example: 'hr@company.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @ApiProperty({
    description: 'Số điện thoại liên hệ',
    example: '+84912345678',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  contactPhone?: string;

  @ApiProperty({
    description: 'Tên công ty',
    example: 'Công ty TNHH ABC',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  @IsString({ message: 'Tên công ty phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên công ty phải có ít nhất 2 ký tự' })
  companyName: string;

  @ApiProperty({
    description:
      'Mật khẩu (tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)',
    example: 'Password@123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
  })
  password: string;

  @ApiProperty({
    description: 'Xác nhận mật khẩu (phải khớp với mật khẩu)',
    example: 'Password@123',
  })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  @MatchPassword('password', { message: 'Mật khẩu xác nhận không khớp' })
  confirmPassword: string;
}
