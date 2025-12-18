// src/modules/admin-job-management/dto/query-job.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JobStatus } from '../../../common/enums';

/**
 * Query DTO for listing jobs in admin panel
 * Supports pagination, search, and status filtering
 */
export class QueryJobDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tiêu đề job, tên công ty, hoặc địa điểm',
    example: 'Senior Developer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái job',
    enum: JobStatus,
    example: JobStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(JobStatus)
  @Type(() => String)
  status?: JobStatus;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường',
    enum: ['createdAt', 'publishedAt', 'deadline', 'title', 'applicationCount'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'publishedAt', 'deadline', 'title', 'applicationCount'])
  sortBy?:
    | 'createdAt'
    | 'publishedAt'
    | 'deadline'
    | 'title'
    | 'applicationCount' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
