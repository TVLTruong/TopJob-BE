// src/modules/candidates/dto/update-candidate-profile.dto.ts

import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsUrl,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender, EducationLevel, ExperienceLevel } from '../../../common/enums';

/**
 * Education DTO for candidate profile
 */
export class CandidateEducationDto {
  @ApiPropertyOptional({ description: 'Tên trường' })
  @IsString()
  school: string;

  @ApiPropertyOptional({ description: 'Bằng cấp' })
  @IsString()
  degree: string;

  @ApiPropertyOptional({ description: 'Chuyên ngành' })
  @IsString()
  major: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (YYYY-MM)' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (YYYY-MM)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Đang học' })
  @IsBoolean()
  currentlyStudying: boolean;

  @ApiPropertyOptional({ description: 'Thông tin bổ sung' })
  @IsOptional()
  @IsString()
  additionalDetails?: string;
}

/**
 * Work Experience DTO for candidate profile
 */
export class CandidateWorkExperienceDto {
  @ApiPropertyOptional({ description: 'Chức vụ' })
  @IsString()
  jobTitle: string;

  @ApiPropertyOptional({ description: 'Tên công ty' })
  @IsString()
  company: string;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (YYYY-MM)' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (YYYY-MM)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Đang làm việc' })
  @IsBoolean()
  currentlyWorking: boolean;

  @ApiPropertyOptional({ description: 'Mô tả công việc' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for updating candidate profile (Next Step after registration)
 * UC-CAN-01: Hoàn thiện hồ sơ ứng viên
 */
export class UpdateCandidateProfileDto {
  @ApiPropertyOptional({
    description: 'Họ và tên ứng viên',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Họ tên tối đa 255 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Giới tính',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Ngày sinh (YYYY-MM-DD)',
    example: '1995-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0912345678',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'URL ảnh đại diện',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString({ message: 'URL ảnh đại diện phải là chuỗi' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Giới thiệu bản thân',
    example: 'Tôi là một lập trình viên với 3 năm kinh nghiệm...',
  })
  @IsOptional()
  @IsString({ message: 'Giới thiệu phải là chuỗi ký tự' })
  bio?: string;

  @ApiPropertyOptional({
    description: 'URL website cá nhân / Portfolio',
    example: 'https://portfolio.example.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL không hợp lệ' })
  personalUrl?: string;

  // Address Fields
  @ApiPropertyOptional({
    description: 'Địa chỉ đường/số nhà',
    example: '123 Nguyễn Huệ',
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @MaxLength(255, { message: 'Địa chỉ tối đa 255 ký tự' })
  addressStreet?: string;

  @ApiPropertyOptional({
    description: 'Quận/Huyện',
    example: 'Quận 1',
  })
  @IsOptional()
  @IsString({ message: 'Quận/Huyện phải là chuỗi' })
  @MaxLength(100, { message: 'Quận/Huyện tối đa 100 ký tự' })
  addressDistrict?: string;

  @ApiPropertyOptional({
    description: 'Tỉnh/Thành phố',
    example: 'TP. Hồ Chí Minh',
  })
  @IsOptional()
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  @MaxLength(100, { message: 'Tỉnh/Thành phố tối đa 100 ký tự' })
  addressCity?: string;

  @ApiPropertyOptional({
    description: 'Quốc gia',
    example: 'Vietnam',
    default: 'Vietnam',
  })
  @IsOptional()
  @IsString({ message: 'Quốc gia phải là chuỗi' })
  @MaxLength(100, { message: 'Quốc gia tối đa 100 ký tự' })
  addressCountry?: string;

  // Experience & Education
  @ApiPropertyOptional({
    description: 'Số năm kinh nghiệm',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số năm kinh nghiệm phải là số nguyên' })
  @Min(0, { message: 'Số năm kinh nghiệm tối thiểu là 0' })
  @Max(50, { message: 'Số năm kinh nghiệm tối đa là 50' })
  experienceYears?: number;

  @ApiPropertyOptional({
    description: 'Cấp độ kinh nghiệm',
    enum: ExperienceLevel,
    example: ExperienceLevel.JUNIOR,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel, { message: 'Cấp độ kinh nghiệm không hợp lệ' })
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Trình độ học vấn',
    enum: EducationLevel,
    example: EducationLevel.BACHELOR_DEGREE,
  })
  @IsOptional()
  @IsEnum(EducationLevel, { message: 'Trình độ học vấn không hợp lệ' })
  educationLevel?: EducationLevel;

  // Education & Work Experience Details
  @ApiPropertyOptional({
    description: 'Chi tiết học vấn',
    type: [CandidateEducationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateEducationDto)
  education?: CandidateEducationDto[];

  @ApiPropertyOptional({
    description: 'Chi tiết kinh nghiệm làm việc',
    type: [CandidateWorkExperienceDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateWorkExperienceDto)
  workExperience?: CandidateWorkExperienceDto[];
}
