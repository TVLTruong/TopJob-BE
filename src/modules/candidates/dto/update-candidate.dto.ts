import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { CandidateGender } from '../entities/candidate.entity';

/**
 * DTO này dùng cho API 'PATCH /candidates/me'
 * để cho phép candidate tự cập nhật hồ sơ
 */
export class UpdateCandidateDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(CandidateGender)
  @IsOptional()
  gender?: CandidateGender;

  @IsDateString() // Dùng IsDateString để nhận chuỗi 'YYYY-MM-DD'
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  cvUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  personalUrl?: string;

  @IsString()
  @IsOptional()
  addressStreet?: string;

  @IsString()
  @IsOptional()
  addressDistrict?: string;

  @IsString()
  @IsOptional()
  addressCity?: string;

  @IsString()
  @IsOptional()
  addressCountry?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  educationLevel?: string;
}