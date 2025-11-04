import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateJobCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsNumber()
  @IsOptional()
  parentId?: number; // ID của danh mục cha (nếu có)

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}