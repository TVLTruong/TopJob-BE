// src/modules/admin-category/dto/update-category.dto.ts

import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating category
 * Only name, slug, and description can be updated
 * Type and parentId are immutable after creation
 */
export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Tên danh mục mới',
    example: 'Software Engineering',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug mới (unique identifier)',
    example: 'software-engineering',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Mô tả mới (chỉ cho CompanyCategory)',
    example: 'Công ty phát triển phần mềm và công nghệ thông tin',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
