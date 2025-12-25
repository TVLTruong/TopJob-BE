// src/modules/candidates/dto/candidate-profile-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Gender, EducationLevel, ExperienceLevel } from '../../../common/enums';

/**
 * CV Response DTO
 */
export class CandidateCvResponseDto {
  @ApiProperty({ description: 'ID của CV' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Tên file CV' })
  @Expose()
  fileName: string;

  @ApiProperty({ description: 'URL của file CV' })
  @Expose()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Kích thước file (bytes)' })
  @Expose()
  fileSize: number | null;

  @ApiProperty({ description: 'CV mặc định' })
  @Expose()
  isDefault: boolean;

  @ApiProperty({ description: 'Ngày upload' })
  @Expose()
  uploadedAt: Date;
}

/**
 * Candidate Profile Response DTO
 */
export class CandidateProfileResponseDto {
  @ApiProperty({ description: 'ID của profile ứng viên' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Họ và tên' })
  @Expose()
  fullName: string;

  @ApiPropertyOptional({ description: 'Email (từ User)' })
  @Expose()
  email?: string;

  @ApiPropertyOptional({ description: 'Giới tính', enum: Gender })
  @Expose()
  gender: Gender | null;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @Expose()
  dateOfBirth: Date | null;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @Expose()
  phoneNumber: string | null;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @Expose()
  avatarUrl: string | null;

  @ApiPropertyOptional({ description: 'Giới thiệu bản thân' })
  @Expose()
  bio: string | null;

  @ApiPropertyOptional({ description: 'URL website cá nhân' })
  @Expose()
  personalUrl: string | null;

  // Address
  @ApiPropertyOptional({ description: 'Địa chỉ đường' })
  @Expose()
  addressStreet: string | null;

  @ApiPropertyOptional({ description: 'Quận/Huyện' })
  @Expose()
  addressDistrict: string | null;

  @ApiPropertyOptional({ description: 'Tỉnh/Thành phố' })
  @Expose()
  addressCity: string | null;

  @ApiPropertyOptional({ description: 'Quốc gia' })
  @Expose()
  addressCountry: string;

  // Experience & Education
  @ApiProperty({ description: 'Số năm kinh nghiệm' })
  @Expose()
  experienceYears: number;

  @ApiPropertyOptional({
    description: 'Cấp độ kinh nghiệm',
    enum: ExperienceLevel,
  })
  @Expose()
  experienceLevel: ExperienceLevel | null;

  @ApiPropertyOptional({
    description: 'Trình độ học vấn',
    enum: EducationLevel,
  })
  @Expose()
  educationLevel: EducationLevel | null;

  // Education & Work Experience Details
  @ApiPropertyOptional({
    description: 'Chi tiết học vấn',
    type: 'array',
    example: [
      {
        school: 'Đại học ABC',
        degree: 'Cử nhân',
        major: 'Khoa học máy tính',
        startDate: '2018-09',
        endDate: '2022-06',
        currentlyStudying: false,
        additionalDetails: 'GPA: 3.8',
      },
    ],
  })
  @Expose()
  education: Array<{
    school: string;
    degree: string;
    major: string;
    startDate: string;
    endDate?: string;
    currentlyStudying: boolean;
    additionalDetails?: string;
  }> | null;

  @ApiPropertyOptional({
    description: 'Chi tiết kinh nghiệm làm việc',
    type: 'array',
    example: [
      {
        jobTitle: 'Software Engineer',
        company: 'Tech Company XYZ',
        startDate: '2022-07',
        endDate: '2024-01',
        currentlyWorking: false,
        description: 'Developed web applications',
      },
    ],
  })
  @Expose()
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    currentlyWorking: boolean;
    description?: string;
  }> | null;

  // CVs
  @ApiPropertyOptional({
    description: 'Danh sách CV',
    type: [CandidateCvResponseDto],
  })
  @Expose()
  @Type(() => CandidateCvResponseDto)
  cvs?: CandidateCvResponseDto[];

  // Computed fields
  @ApiPropertyOptional({ description: 'Địa chỉ đầy đủ' })
  @Expose()
  fullAddress?: string;

  @ApiPropertyOptional({ description: 'Tuổi' })
  @Expose()
  age?: number | null;

  @ApiProperty({ description: 'Đã có CV chưa' })
  @Expose()
  hasCV?: boolean;

  @ApiProperty({ description: 'Ngày tạo' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  @Expose()
  updatedAt: Date;
}
