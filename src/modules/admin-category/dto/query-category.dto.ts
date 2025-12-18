// src/modules/admin-category/dto/query-category.dto.ts

import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Category type enum for filtering
 */
export enum CategoryType {
  JOB_CATEGORY = 'job_category',
  COMPANY_CATEGORY = 'company_category',
}

/**
 * Query DTO for listing categories
 * Supports pagination, search, and filtering by type and active status
 */
export class QueryCategoryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Loại danh mục',
    enum: CategoryType,
    example: CategoryType.JOB_CATEGORY,
  })
  @IsOptional()
  @IsEnum(CategoryType)
  @Type(() => String)
  type?: CategoryType;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên hoặc slug',
    example: 'software',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái active',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường',
    enum: ['createdAt', 'name', 'slug'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'name', 'slug'])
  sortBy?: 'createdAt' | 'name' | 'slug' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
