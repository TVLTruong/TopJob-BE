// src/modules/jobs/dto/public-search-jobs.dto.ts
import { IsOptional, IsString, IsEnum, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { JobType, ExperienceLevel } from '../../../common/enums';

/**
 * Sort Options for Public Job Search
 */
export enum JobSortOption {
  NEWEST = 'newest', // Mới nhất (theo publishedAt)
  RELEVANT = 'relevant', // Liên quan nhất (theo isUrgent, isFeatured)
}

/**
 * DTO for Public Job Search (Guest/Candidate)
 * UC-GUEST-01: Tìm kiếm việc làm công khai
 */
export class PublicSearchJobsDto extends PaginationDto {
  /**
   * Từ khóa tìm kiếm (title, description)
   * @example "fullstack developer"
   */
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm trong tiêu đề và mô tả công việc',
    example: 'fullstack developer',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  /**
   * Lọc theo location (city/province)
   * @example "Hồ Chí Minh"
   */
  @ApiPropertyOptional({
    description: 'Lọc theo tỉnh/thành phố',
    example: 'Hồ Chí Minh',
  })
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * Lọc theo loại công việc
   * @example "full_time"
   */
  @ApiPropertyOptional({
    description: 'Lọc theo loại hình công việc',
    enum: JobType,
    example: JobType.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  /**
   * Lọc theo cấp độ kinh nghiệm
   * @example "junior"
   */
  @ApiPropertyOptional({
    description: 'Lọc theo cấp độ kinh nghiệm',
    enum: ExperienceLevel,
    example: ExperienceLevel.JUNIOR,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  /**
   * Lọc theo lĩnh vực (category ID)
   * @example "1"
   */
  @ApiPropertyOptional({
    description: 'Lọc theo lĩnh vực công việc (category ID)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  /**
   * Mức lương tối thiểu (VND)
   * @example 10000000
   */
  @ApiPropertyOptional({
    description: 'Mức lương tối thiểu (VND)',
    example: 10000000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  /**
   * Mức lương tối đa (VND)
   * @example 30000000
   */
  @ApiPropertyOptional({
    description: 'Mức lương tối đa (VND)',
    example: 30000000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  /**
   * Lọc theo công việc nổi bật (hot jobs)
   * @example true
   */
  @ApiPropertyOptional({
    description: 'Chỉ lấy công việc nổi bật (isHot = true)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isHot?: boolean;

  /**
   * Sắp xếp theo
   * @example "newest"
   */
  @ApiPropertyOptional({
    description: 'Sắp xếp kết quả',
    enum: JobSortOption,
    example: JobSortOption.NEWEST,
    default: JobSortOption.NEWEST,
  })
  @IsOptional()
  @IsEnum(JobSortOption)
  sort?: JobSortOption = JobSortOption.NEWEST;
}
