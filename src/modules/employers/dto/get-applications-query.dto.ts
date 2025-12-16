// src/modules/employers/dto/get-applications-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ApplicationStatus } from '../../../common/enums';

/**
 * Query DTO for GET /employer/applications
 * Supports filtering, searching, and pagination
 */
export class GetApplicationsQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Lọc theo Job ID (job phải thuộc employer hiện tại)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái đơn ứng tuyển',
    enum: ApplicationStatus,
    example: ApplicationStatus.NEW,
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    description: 'Lọc từ ngày nộp đơn (ISO 8601 format)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Lọc đến ngày nộp đơn (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên ứng viên (không phân biệt hoa thường)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  candidateName?: string;
}
