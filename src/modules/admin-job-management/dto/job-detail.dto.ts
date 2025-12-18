// src/modules/admin-job-management/dto/job-detail.dto.ts

import { Expose, Type } from 'class-transformer';
import {
  JobStatus,
  JobType,
  ExperienceLevel,
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
  categoryId: string;

  @Expose()
  locationId: string;

  @Expose()
  title: string;

  @Expose()
  slug: string;

  @Expose()
  description: string | null;

  @Expose()
  requirements: string | null;

  @Expose()
  responsibilities: string | null;

  @Expose()
  niceToHave: string | null;

  @Expose()
  salaryMin: number | null;

  @Expose()
  salaryMax: number | null;

  @Expose()
  isNegotiable: boolean;

  @Expose()
  jobType: JobType;

  @Expose()
  experienceLevel: ExperienceLevel | null;

  @Expose()
  positionsAvailable: number;

  @Expose()
  requiredSkills: string[] | null;

  @Expose()
  status: JobStatus;

  @Expose()
  deadline: Date | null;

  @Expose()
  publishedAt: Date | null;

  @Expose()
  applicationCount: number;

  @Expose()
  viewCount: number;

  @Expose()
  isFeatured: boolean;

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
  category: JobCategoryInfoDto;

  @Expose()
  @Type(() => JobLocationInfoDto)
  location: JobLocationInfoDto;
}
