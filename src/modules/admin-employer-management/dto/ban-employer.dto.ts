// src/modules/admin-employer-management/dto/ban-employer.dto.ts

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanEmployerDto {
  @ApiProperty({
    description: 'Lý do cấm tài khoản (bắt buộc)',
    example: 'Vi phạm chính sách đăng tin tuyển dụng',
    minLength: 10,
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Lý do cấm là bắt buộc' })
  @IsString()
  @MinLength(10, { message: 'Lý do cấm phải có ít nhất 10 ký tự' })
  @MaxLength(1000, { message: 'Lý do cấm không được vượt quá 1000 ký tự' })
  reason: string;
}
