// src/modules/admin-employer-management/dto/employer-detail.dto.ts

import { Expose, Type } from 'class-transformer';
import { UserRole, UserStatus, EmployerStatus } from '../../../common/enums';

/**
 * User information in employer detail
 */
export class EmployerUserInfoDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;

  @Expose()
  status: UserStatus;

  @Expose()
  isVerified: boolean;

  @Expose()
  emailVerifiedAt: Date | null;

  @Expose()
  lastLoginAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

/**
 * Employer profile information
 */
export class EmployerProfileInfoDto {
  @Expose()
  id: string;

  @Expose()
  fullName: string;

  @Expose()
  workTitle: string | null;

  @Expose()
  companyName: string;

  @Expose()
  description: string | null;

  @Expose()
  website: string | null;

  @Expose()
  logoUrl: string | null;

  @Expose()
  coverImageUrl: string | null;

  @Expose()
  foundedDate: number | null;

  @Expose()
  companySize: string | null;

  @Expose()
  contactEmail: string | null;

  @Expose()
  contactPhone: string | null;

  @Expose()
  linkedlnUrl: string | null;

  @Expose()
  facebookUrl: string | null;

  @Expose()
  xUrl: string | null;

  @Expose()
  benefits: string[] | null;

  @Expose()
  status: EmployerStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

/**
 * Job statistics for employer
 */
export class EmployerJobStatsDto {
  @Expose()
  totalJobs: number;

  @Expose()
  activeJobs: number;

  @Expose()
  pendingJobs: number;

  @Expose()
  rejectedJobs: number;
}

/**
 * Employer location information
 */
export class EmployerLocationDto {
  @Expose()
  id: string;

  @Expose()
  province: string;

  @Expose()
  district: string;

  @Expose()
  detailedAddress: string;

  @Expose()
  isHeadquarters: boolean;
}

/**
 * Industry/Category information
 */
export class EmployerIndustryDto {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
}

/**
 * Complete employer detail response
 */
export class EmployerDetailResponseDto {
  @Expose()
  @Type(() => EmployerUserInfoDto)
  user: EmployerUserInfoDto;

  @Expose()
  @Type(() => EmployerProfileInfoDto)
  profile: EmployerProfileInfoDto;

  @Expose()
  @Type(() => EmployerJobStatsDto)
  jobStats: EmployerJobStatsDto;

  @Expose()
  @Type(() => EmployerLocationDto)
  locations: EmployerLocationDto[];

  @Expose()
  industries: EmployerIndustryDto[];
}
