// src/modules/jobs/dto/create-job.dto.ts

import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExperienceLevel, JobType, WorkMode } from '../../../common/enums';

export class CreateJobDto {
  @ApiProperty({
    description: 'Danh sách ID các danh mục (tối thiểu 1)',
    example: ['1', '2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  categoryIds: string[];

  @ApiPropertyOptional({
    description: 'ID danh mục chính (nếu không chỉ định, sẽ lấy cái đầu tiên)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  primaryCategoryId?: string;

  @ApiProperty({ description: 'ID địa điểm (thuộc employer)', example: '10' })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID công nghệ cho tin tuyển dụng',
    example: ['1', '2', '3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologyIds?: string[];

  @ApiPropertyOptional({
    description: 'ID công nghệ chính (nếu không chỉ định, sẽ lấy cái đầu tiên)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  primaryTechnologyId?: string;

  @ApiProperty({ description: 'Tiêu đề tin tuyển dụng' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả công việc' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Yêu cầu (mỗi phần là 1 item trong array)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({
    description: 'Trách nhiệm (mỗi phần là 1 item trong array)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @ApiPropertyOptional({
    description: 'Nice to have (mỗi phần là 1 item trong array)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  niceToHave?: string[];

  @ApiPropertyOptional({
    description: 'Phúc lợi (mỗi phần là 1 item trong array)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Lương tối thiểu' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number | null;

  @ApiPropertyOptional({ description: 'Lương tối đa' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf(
    (o: CreateJobDto) =>
      o.salaryMax === undefined ||
      o.salaryMin === undefined ||
      o.salaryMax === null ||
      o.salaryMin === null ||
      o.salaryMax >= o.salaryMin,
  )
  salaryMax?: number | null;

  @ApiPropertyOptional({ description: 'Có thể thương lượng', default: false })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiPropertyOptional({
    description: 'Hiển thị lương công khai',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isSalaryVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Đơn vị tiền tệ',
    default: 'VND',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  salaryCurrency?: string;

  @ApiProperty({ description: 'Loại hình công việc', enum: JobType })
  @IsEnum(JobType)
  employmentType: JobType;

  @ApiProperty({ description: 'Hình thức làm việc', enum: WorkMode })
  @IsEnum(WorkMode)
  workMode: WorkMode;

  @ApiPropertyOptional({
    description: 'Cấp độ kinh nghiệm',
    enum: ExperienceLevel,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Số năm kinh nghiệm tối thiểu',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYearsMin?: number;

  @ApiPropertyOptional({ description: 'Số lượng tuyển', default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Ngày hết hạn (ISO date)' })
  @IsOptional()
  @IsDateString()
  expiredAt?: string;

  @ApiPropertyOptional({ description: 'Tin HOT (nổi bật)', default: false })
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional({ description: 'Tin tuyển gấp', default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;
}
