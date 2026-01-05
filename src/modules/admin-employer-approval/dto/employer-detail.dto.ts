// src/modules/admin-employer-approval/dto/employer-detail.dto.ts

import { Expose, Type } from 'class-transformer';
import {
  UserRole,
  UserStatus,
  EmployerStatus,
  EmployerProfileStatus,
} from '../../../common/enums';

/**
 * User information for employer detail
 */
export class EmployerUserDto {
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
  createdAt: Date;
}

/**
 * Location information
 */
export class EmployerLocationDto {
  @Expose()
  id: string;

  @Expose()
  province: string;

  @Expose()
  district: string;

  @Expose()
  detailedAddress: string | null;

  @Expose()
  isHeadquarters: boolean;
}

/**
 * Category information for employer
 */
export class EmployerCategoryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  isPrimary: boolean;
}

/**
 * Pending edit field comparison
 */
export class PendingEditFieldDto {
  @Expose()
  fieldName: string;

  @Expose()
  fieldLabel: string;

  @Expose()
  oldValue: string | null;

  @Expose()
  newValue: string | null;

  @Expose()
  createdAt: Date;
}

/**
 * Employer profile information
 */
export class EmployerProfileDto {
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
  technologies: string[] | null;

  @Expose()
  @Type(() => EmployerLocationDto)
  locations: EmployerLocationDto[] | null;

  @Expose()
  @Type(() => EmployerCategoryDto)
  employerCategories: EmployerCategoryDto[] | null;

  @Expose()
  status: EmployerStatus;

  @Expose()
  profileStatus: EmployerProfileStatus;

  @Expose()
  isApproved: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

/**
 * Complete employer detail response
 */
export class EmployerDetailDto {
  @Expose()
  @Type(() => EmployerUserDto)
  user: EmployerUserDto;

  @Expose()
  @Type(() => EmployerProfileDto)
  employer: EmployerProfileDto;

  @Expose()
  @Type(() => PendingEditFieldDto)
  pendingEdits: PendingEditFieldDto[] | [];

  @Expose()
  hasPendingEdits: boolean;
}
