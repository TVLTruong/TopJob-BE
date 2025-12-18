// src/modules/admin-job-management/dto/remove-job.dto.ts

import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for removing job by admin
 * Used to force remove ACTIVE jobs with optional reason
 */
export class RemoveJobDto {
  @ApiPropertyOptional({
    description:
      'Lý do gỡ job (tùy chọn). Ví dụ: vi phạm chính sách, nội dung không phù hợp',
    example: 'Job chứa nội dung vi phạm chính sách tuyển dụng',
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(10, 500, {
    message: 'Lý do gỡ job phải từ 10 đến 500 ký tự',
  })
  reason?: string;
}
