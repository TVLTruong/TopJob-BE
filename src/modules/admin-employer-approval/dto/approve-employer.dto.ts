// src/modules/admin-employer-approval/dto/approve-employer.dto.ts

import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveEmployerDto {
  @ApiPropertyOptional({
    description: 'Ghi chú khi duyệt hồ sơ nhà tuyển dụng',
    example: 'Hồ sơ đầy đủ và hợp lệ',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  note?: string;
}
