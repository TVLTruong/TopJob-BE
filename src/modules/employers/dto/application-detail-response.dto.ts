// src/modules/employers/dto/application-detail-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ApplicationStatus,
  Gender,
  ExperienceLevel,
  JobType,
  WorkMode,
} from '../../../common/enums';

/**
 * Candidate CV DTO for Application Details
 */
export class ApplicationCvDto {
  @ApiProperty({ description: 'CV ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Tên file CV' })
  @Expose()
  fileName: string;

  @ApiProperty({ description: 'URL file CV' })
  @Expose()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Kích thước file (bytes)' })
  @Expose()
  fileSize: number | null;

  @ApiProperty({ description: 'Ngày upload' })
  @Expose()
  uploadedAt: Date;
}

/**
 * Candidate Info DTO for Application Details
 */
export class ApplicationCandidateDto {
  @ApiProperty({ description: 'Candidate ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Họ và tên ứng viên' })
  @Expose()
  fullName: string;

  @ApiProperty({ description: 'Email ứng viên' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @Expose()
  phoneNumber: string | null;

  @ApiPropertyOptional({ description: 'Giới tính', enum: Gender })
  @Expose()
  gender: Gender | null;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @Expose()
  dateOfBirth: Date | null;

  @ApiPropertyOptional({ description: 'Ảnh đại diện' })
  @Expose()
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'Địa chỉ - Tỉnh/Thành phố' })
  @Expose()
  addressCity: string | null;

  @ApiPropertyOptional({ description: 'Số năm kinh nghiệm' })
  @Expose()
  experienceYears: number;

  @ApiPropertyOptional({
    description: 'Cấp độ kinh nghiệm',
    enum: ExperienceLevel,
  })
  @Expose()
  experienceLevel: ExperienceLevel | null;
}

/**
 * Job Info DTO for Application Details
 */
export class ApplicationJobDto {
  @ApiProperty({ description: 'Job ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Tiêu đề tin tuyển dụng' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Slug' })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ description: 'Loại hình công việc', enum: JobType })
  @Expose()
  employmentType: JobType;

  @ApiPropertyOptional({ description: 'Chế độ làm việc', enum: WorkMode })
  @Expose()
  workMode: WorkMode;

  @ApiPropertyOptional({ description: 'Lương tối thiểu' })
  @Expose()
  salaryMin: number | null;

  @ApiPropertyOptional({ description: 'Lương tối đa' })
  @Expose()
  salaryMax: number | null;

  @ApiProperty({ description: 'Có thể thương lượng' })
  @Expose()
  isNegotiable: boolean;

  @ApiPropertyOptional({ description: 'Hạn nộp' })
  @Expose()
  expiredAt: Date | null;
}

/**
 * Application Detail Response DTO
 * For employer to view application details
 */
export class ApplicationDetailResponseDto {
  @ApiProperty({ description: 'Application ID' })
  @Expose()
  id: string;
  @ApiProperty({
    description: 'Trạng thái đơn ứng tuyển',
    enum: ApplicationStatus,
  })
  @Expose()
  status: ApplicationStatus;

  @ApiProperty({ description: 'Ngày nộp đơn' })
  @Expose()
  appliedAt: Date;

  @ApiPropertyOptional({ description: 'Thời gian cập nhật trạng thái' })
  @Expose()
  statusUpdatedAt: Date | null;

  @ApiProperty({
    description: 'Thông tin ứng viên',
    type: ApplicationCandidateDto,
  })
  @Expose()
  @Type(() => ApplicationCandidateDto)
  candidate: ApplicationCandidateDto;

  @ApiProperty({
    description: 'Thông tin công việc',
    type: ApplicationJobDto,
  })
  @Expose()
  @Type(() => ApplicationJobDto)
  job: ApplicationJobDto;

  @ApiPropertyOptional({ description: 'CV đã nộp', type: ApplicationCvDto })
  @Expose()
  @Type(() => ApplicationCvDto)
  cv: ApplicationCvDto | null;

  @ApiProperty({ description: 'Ngày tạo' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  @Expose()
  updatedAt: Date;
}
