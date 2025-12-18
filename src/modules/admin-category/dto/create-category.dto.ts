// src/modules/admin-category/dto/create-category.dto.ts

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from './query-category.dto';

/**
 * DTO for creating a new category
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Loại danh mục cần tạo',
    enum: CategoryType,
    example: CategoryType.JOB_CATEGORY,
  })
  @IsEnum(CategoryType)
  @IsNotEmpty()
  type: CategoryType;

  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Software Development',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @ApiProperty({
    description: 'Slug (unique identifier)',
    example: 'software-development',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  slug: string;

  @ApiPropertyOptional({
    description: 'Mô tả danh mục (chỉ cho CompanyCategory)',
    example: 'Các công ty trong lĩnh vực phát triển phần mềm',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID danh mục cha (chỉ cho JobCategory - tree structure)',
    example: '123',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
