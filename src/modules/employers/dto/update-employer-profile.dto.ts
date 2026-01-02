// src/modules/employers/dto/update-employer-profile.dto.ts

import {
  IsOptional,
  IsString,
  // IsEnum,
  // IsInt,
  IsDate,
  // Min,
  // Max,
  MaxLength,
  IsUrl,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
// import { CompanySize } from '../../../common/enums';

/**
 * DTO for adding/updating employer location
 */
export class EmployerLocationDto {
  @ApiPropertyOptional({
    description: 'ID location (để update, bỏ qua nếu thêm mới)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Là trụ sở chính',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isHeadquarters phải là boolean' })
  isHeadquarters?: boolean;

  @ApiPropertyOptional({
    description: 'Tỉnh/Thành phố',
    example: 'TP. Hồ Chí Minh',
  })
  @IsOptional()
  @IsString({ message: 'Tỉnh/Thành phố phải là chuỗi' })
  @MaxLength(100, { message: 'Tỉnh/Thành phố tối đa 100 ký tự' })
  province?: string;

  @ApiPropertyOptional({
    description: 'Quận/Huyện',
    example: 'Quận 1',
  })
  @IsOptional()
  @IsString({ message: 'Quận/Huyện phải là chuỗi' })
  @MaxLength(100, { message: 'Quận/Huyện tối đa 100 ký tự' })
  district?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ chi tiết',
    example: '123 Nguyễn Huệ, Phường Bến Nghé',
  })
  @IsOptional()
  @IsString({ message: 'Địa chỉ chi tiết phải là chuỗi' })
  detailedAddress?: string;
}

/**
 * DTO for updating employer profile (Next Step after registration)
 * UC-EMP-01: Hoàn thiện hồ sơ nhà tuyển dụng
 */
export class UpdateEmployerProfileDto {
  // Contact Person Info
  @ApiPropertyOptional({
    description: 'Họ và tên người đại diện',
    example: 'Nguyễn Văn B',
  })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Họ tên tối đa 255 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Chức vụ',
    example: 'Giám đốc Nhân sự',
  })
  @IsOptional()
  @IsString({ message: 'Chức vụ phải là chuỗi' })
  @MaxLength(255, { message: 'Chức vụ tối đa 255 ký tự' })
  workTitle?: string;

  // Company Info
  @ApiPropertyOptional({
    description: 'Tên công ty',
    example: 'Công ty TNHH ABC',
  })
  @IsOptional()
  @IsString({ message: 'Tên công ty phải là chuỗi' })
  @MaxLength(255, { message: 'Tên công ty tối đa 255 ký tự' })
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Mô tả công ty',
    example: 'Công ty chúng tôi là một trong những công ty hàng đầu...',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Website công ty',
    example: 'https://company.com',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website không đúng định dạng URL' })
  website?: string;

  // Company Media
  @ApiPropertyOptional({
    description: 'URL logo công ty',
    example: 'https://cloudinary.com/abc123/logo.png',
  })
  @IsOptional()
  @IsString({ message: 'URL logo phải là chuỗi' })
  logoUrl?: string;

  // @ApiPropertyOptional({
  //   description: 'URL ảnh bìa công ty',
  //   example: 'https://cloudinary.com/abc123/cover.jpg',
  // })
  // @IsOptional()
  // @IsString({ message: 'URL ảnh bìa phải là chuỗi' })
  // coverImageUrl?: string;

  // Company Details
  @ApiPropertyOptional({
    description: 'Ngày thành lập',
    example: '21/11/2010',
    format: 'mm/dd/yyyy',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày thành lập tuân theo format mm/dd/yyyy' })
  foundedDate?: Date;

  // @ApiPropertyOptional({
  //   description: 'Quy mô công ty',
  //   enum: CompanySize,
  //   example: CompanySize.MEDIUM,
  // })
  // @IsOptional()
  // @IsEnum(CompanySize, { message: 'Quy mô công ty không hợp lệ' })
  // companySize?: CompanySize;

  // Contact Info
  @ApiPropertyOptional({
    description: 'Email liên hệ',
    example: 'hr@company.com',
  })
  @IsOptional()
  @IsString({ message: 'Email liên hệ phải là chuỗi' })
  @MaxLength(255, { message: 'Email liên hệ tối đa 255 ký tự' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại liên hệ',
    example: '028-1234-5678',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  contactPhone?: string;

  // Social Media
  @ApiPropertyOptional({
    description: 'LinkedIn URL',
    example: 'https://linkedin.com/company/abc',
  })
  @IsOptional()
  @IsUrl({}, { message: 'LinkedIn URL không đúng định dạng' })
  linkedlnUrl?: string;

  @ApiPropertyOptional({
    description: 'Facebook URL',
    example: 'https://facebook.com/abc',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Facebook URL không đúng định dạng' })
  facebookUrl?: string;

  @ApiPropertyOptional({
    description: 'X (Twitter) URL',
    example: 'https://x.com/abc',
  })
  @IsOptional()
  @IsUrl({}, { message: 'X URL không đúng định dạng' })
  xUrl?: string;

  // Benefits
  @ApiPropertyOptional({
    description: 'Danh sách phúc lợi',
    example: ['Bảo hiểm sức khỏe', 'Thưởng tháng 13', 'Du lịch hàng năm'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Phúc lợi phải là mảng' })
  @IsString({ each: true, message: 'Mỗi phúc lợi phải là chuỗi' })
  benefits?: string[];

  // employerCategory
  @ApiPropertyOptional({
    description: 'Danh sách danh mục nhà tuyển dụng',
    example: ['Công nghệ thông tin', 'Tài chính', 'Marketing'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Danh mục nhà tuyển dụng phải là mảng' })
  @IsString({
    each: true,
    message: 'Mỗi danh mục nhà tuyển dụng phải là chuỗi',
  })
  employerCategory?: string[];

  // Technologies
  @ApiPropertyOptional({
    description: 'Danh sách công nghệ sử dụng',
    example: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Công nghệ phải là mảng' })
  @IsString({ each: true, message: 'Mỗi công nghệ phải là chuỗi' })
  technologies?: string[];

  // Locations
  @ApiPropertyOptional({
    description: 'Danh sách địa điểm văn phòng',
    type: [EmployerLocationDto],
  })
  // @IsOptional()
  @IsArray({ message: 'Locations phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => EmployerLocationDto)
  locations?: EmployerLocationDto[];
}
