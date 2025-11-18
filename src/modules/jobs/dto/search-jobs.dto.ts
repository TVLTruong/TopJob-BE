// src/modules/jobs/dto/search-jobs.dto.ts
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto'; // (Dùng 'tool' chung)
import { JobType, ExperienceLevel } from '../../../common/enums'; // (Dùng 'tool' enums)

export class SearchJobsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  q?: string; // (Từ khóa - Dịch từ UC-GUEST-01, Bước 1 [cite: 187])

  @IsOptional()
  @IsString()
  city?: string; // (Tỉnh/Thành - Dịch từ UC-GUEST-01, Bước 2 [cite: 188])

  @IsOptional()
  @IsString()
  categorySlug?: string; // (Lọc theo Chuyên môn (Bảng 7))

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number; // (Lọc lương - Dịch từ A2 [cite: 201])

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType; // (Lọc loại CV - Dịch từ A2 [cite: 201])

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel; // (Lọc kinh nghiệm - Dịch từ A2 [cite: 201])

  @IsOptional()
  @IsString()
  sort?: string; // (Sắp xếp: 'newest', 'relevant' - Dịch từ A2 [cite: 201])
}