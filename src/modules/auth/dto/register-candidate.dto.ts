// src/auth/dto/register-candidate.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MatchPassword } from '../validators/match-password.validator';

export class RegisterCandidateDto {
  [key: string]: unknown;
  @ApiProperty({
    description: 'Họ và tên ứng viên',
    example: 'Nguyễn Văn A',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullName: string;

  @ApiProperty({
    description: 'Email của ứng viên',
    example: 'candidate@example.com',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

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
