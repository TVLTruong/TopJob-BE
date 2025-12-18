// src/modules/admin-job-approval/dto/query-job.dto.ts

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryJobDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên công việc',
    example: 'Senior Backend Developer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter theo category ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter theo employer ID',
    example: '1',
  })
  @IsOptional()
  @IsString()
  employerId?: string;
}
