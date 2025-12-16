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
import { ExperienceLevel, JobType } from '../../../common/enums';

export class CreateJobDto {
    @ApiProperty({ description: 'ID danh mục', example: '1' })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({ description: 'ID địa điểm (thuộc employer)', example: '10' })
    @IsString()
    @IsNotEmpty()
    locationId: string;

    @ApiProperty({ description: 'Tiêu đề tin tuyển dụng' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ description: 'Mô tả công việc' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Yêu cầu' })
    @IsOptional()
    @IsString()
    requirements?: string;

    @ApiPropertyOptional({ description: 'Trách nhiệm' })
    @IsOptional()
    @IsString()
    responsibilities?: string;

    @ApiPropertyOptional({ description: 'Nice to have' })
    @IsOptional()
    @IsString()
    niceToHave?: string;

    @ApiPropertyOptional({ description: 'Lương tối thiểu' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    salaryMin?: number;

    @ApiPropertyOptional({ description: 'Lương tối đa' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @ValidateIf((o) => o.salaryMax === undefined || o.salaryMin === undefined || o.salaryMax >= o.salaryMin)
    salaryMax?: number;

    @ApiPropertyOptional({ description: 'Có thể thương lượng', default: false })
    @IsOptional()
    @IsBoolean()
    isNegotiable?: boolean;

    @ApiProperty({ description: 'Hình thức làm việc', enum: JobType })
    @IsEnum(JobType)
    jobType: JobType;

    @ApiPropertyOptional({
        description: 'Cấp độ kinh nghiệm',
        enum: ExperienceLevel,
    })
    @IsOptional()
    @IsEnum(ExperienceLevel)
    experienceLevel?: ExperienceLevel;

    @ApiPropertyOptional({ description: 'Số lượng tuyển', default: 1 })
    @IsOptional()
    @IsInt()
    @IsPositive()
    positionsAvailable?: number;

    @ApiPropertyOptional({
        description: 'Kỹ năng yêu cầu',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    requiredSkills?: string[];

    @ApiPropertyOptional({ description: 'Hạn nộp (ISO date)' })
    @IsOptional()
    @IsDateString()
    deadline?: string;
}

