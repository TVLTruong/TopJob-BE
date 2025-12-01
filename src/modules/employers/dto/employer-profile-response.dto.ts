// src/modules/employers/dto/employer-profile-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  EmployerStatus,
  EmployerProfileStatus,
  CompanySize,
} from '../../../common/enums';

/**
 * Location Response DTO
 */
export class EmployerLocationResponseDto {
  @ApiProperty({ description: 'ID của location' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Là trụ sở chính' })
  @Expose()
  isHeadquarters: boolean;

  @ApiProperty({ description: 'Tỉnh/Thành phố' })
  @Expose()
  province: string;

  @ApiProperty({ description: 'Quận/Huyện' })
  @Expose()
  district: string;

  @ApiProperty({ description: 'Địa chỉ chi tiết' })
  @Expose()
  detailedAddress: string;

  @ApiPropertyOptional({ description: 'Địa chỉ đầy đủ' })
  @Expose()
  fullAddress?: string;
}

/**
 * Employer Profile Response DTO
 */
export class EmployerProfileResponseDto {
  @ApiProperty({ description: 'ID của profile nhà tuyển dụng' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User ID' })
  @Expose()
  userId: string;

  // Contact Person Info
  @ApiProperty({ description: 'Họ và tên người đại diện' })
  @Expose()
  fullName: string;

  @ApiPropertyOptional({ description: 'Chức vụ' })
  @Expose()
  workTitle: string | null;

  @ApiPropertyOptional({ description: 'Email (từ User)' })
  @Expose()
  email?: string;

  // Company Info
  @ApiProperty({ description: 'Tên công ty' })
  @Expose()
  companyName: string;

  @ApiPropertyOptional({ description: 'Mô tả công ty' })
  @Expose()
  description: string | null;

  @ApiPropertyOptional({ description: 'Website công ty' })
  @Expose()
  website: string | null;

  // Company Media
  @ApiPropertyOptional({ description: 'URL logo công ty' })
  @Expose()
  logoUrl: string | null;

  @ApiPropertyOptional({ description: 'URL ảnh bìa' })
  @Expose()
  coverImageUrl: string | null;

  // Company Details
  @ApiPropertyOptional({ description: 'Năm thành lập' })
  @Expose()
  foundedYear: number | null;

  @ApiPropertyOptional({ description: 'Quy mô công ty', enum: CompanySize })
  @Expose()
  companySize: CompanySize | null;

  // Contact Info
  @ApiPropertyOptional({ description: 'Email liên hệ' })
  @Expose()
  contactEmail: string | null;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @Expose()
  contactPhone: string | null;

  // Social Media
  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @Expose()
  linkedlnUrl: string | null;

  @ApiPropertyOptional({ description: 'Facebook URL' })
  @Expose()
  facebookUrl: string | null;

  @ApiPropertyOptional({ description: 'X (Twitter) URL' })
  @Expose()
  xUrl: string | null;

  // Status Fields
  @ApiProperty({ description: 'Đã được duyệt' })
  @Expose()
  isApproved: boolean;

  @ApiProperty({ description: 'Trạng thái', enum: EmployerStatus })
  @Expose()
  status: EmployerStatus;

  @ApiProperty({
    description: 'Trạng thái hồ sơ',
    enum: EmployerProfileStatus,
  })
  @Expose()
  profileStatus: EmployerProfileStatus;

  // Benefits
  @ApiPropertyOptional({ description: 'Danh sách phúc lợi', type: [String] })
  @Expose()
  benefits: string[];

  // Locations
  @ApiPropertyOptional({
    description: 'Danh sách địa điểm',
    type: [EmployerLocationResponseDto],
  })
  @Expose()
  @Type(() => EmployerLocationResponseDto)
  locations?: EmployerLocationResponseDto[];

  // Computed fields
  @ApiPropertyOptional({ description: 'Tuổi công ty (năm)' })
  @Expose()
  companyAge?: number | null;

  @ApiPropertyOptional({ description: 'Trụ sở chính' })
  @Expose()
  @Type(() => EmployerLocationResponseDto)
  headquarters?: EmployerLocationResponseDto;

  @ApiProperty({ description: 'Hồ sơ đã hoàn thiện' })
  @Expose()
  hasCompleteProfile?: boolean;

  @ApiProperty({ description: 'Ngày tạo' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Ngày cập nhật' })
  @Expose()
  updatedAt: Date;
}
