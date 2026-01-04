// src/modules/admin-job-management/dto/job-detail.dto.ts

import { Expose, Type } from 'class-transformer';
import {
  JobStatus,
  JobType,
  ExperienceLevel,
  WorkMode,
  EmployerStatus,
} from '../../../common/enums';

/**
 * Employer information in job detail
 */
export class JobEmployerInfoDto {
  @Expose()
  id: string;

  @Expose()
  companyName: string;

  @Expose()
  companyLogo: string | null;

  @Expose()
  status: EmployerStatus;

  @Expose()
  createdAt: Date;
}

/**
 * Category information in job detail
 */
export class JobCategoryInfoDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;
}

/**
 * Location information in job detail
 */
export class JobLocationInfoDto {
  @Expose()
  id: string;

  @Expose()
  address: string;

  @Expose()
  city: string;

  @Expose()
  country: string;
}

/**
 * Detailed job information for admin
 */
export class JobDetailDto {
  @Expose()
  id: string;

  @Expose()
  employerId: string;

  @Expose()
  locationId: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  description: string | null;

  @Expose()
  requirements: string[] | null;

  @Expose()
  responsibilities: string[] | null;

  @Expose()
  niceToHave: string[] | null;

  @Expose()
  benefits: string[] | null;

  @Expose()
  salaryMin: number | null;

  @Expose()
  salaryMax: number | null;

  @Expose()
  isNegotiable: boolean;

  @Expose()
  isSalaryVisible: boolean;

  @Expose()
  salaryCurrency: string;

  @Expose()
  employmentType: JobType;

  @Expose()
  workMode: WorkMode;

  @Expose()
  experienceLevel: ExperienceLevel | null;

  @Expose()
  experienceYearsMin: number | null;

  @Expose()
  quantity: number;

  @Expose()
  status: JobStatus;

  @Expose()
  expiredAt: Date | null;

  @Expose()
  publishedAt: Date | null;

  @Expose()
  applyCount: number;

  @Expose()
  viewCount: number;

  @Expose()
  saveCount: number;

  @Expose()
  isHot: boolean;

  @Expose()
  isUrgent: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => JobEmployerInfoDto)
  employer: JobEmployerInfoDto;

  @Expose()
  @Type(() => JobCategoryInfoDto)
  categories: JobCategoryInfoDto[];

  @Expose()
  @Type(() => JobLocationInfoDto)
  location: JobLocationInfoDto;
}
