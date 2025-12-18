// src/modules/candidates/dto/apply-job.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for applying to a job
 */
export class ApplyJobDto {
  @ApiPropertyOptional({
    description:
      'ID của CV sử dụng để ứng tuyển (nếu không có sẽ dùng CV mặc định)',
    example: '1',
  })
  @IsOptional()
  @IsString({ message: 'CV ID phải là chuỗi' })
  cvId?: string;
}
