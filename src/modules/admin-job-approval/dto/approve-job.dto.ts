// src/modules/admin-job-approval/dto/approve-job.dto.ts

import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveJobDto {
  @ApiPropertyOptional({
    description: 'Ghi chú khi duyệt (tùy chọn)',
    example: 'Tin tuyển dụng phù hợp, đã duyệt',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  note?: string;
}
