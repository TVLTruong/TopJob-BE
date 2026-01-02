// src/modules/admin-job-approval/dto/job-detail.dto.ts

import { Expose, Type } from 'class-transformer';
import {
  JobStatus,
  JobType,
  ExperienceLevel,
  WorkMode,
} from '../../../common/enums';

/**
 * Employer info for job detail
 */
export class JobEmployerDto {
  @Expose()
  id: string;

  @Expose()
  companyName: string;

  @Expose()
  logoUrl: string | null;

  @Expose()
  contactEmail: string | null;
}

/**
 * Category info for job detail
 */
export class JobCategoryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;
}

/**
 * Location info for job detail
 */
export class JobLocationDto {
  @Expose()
  id: string;

  @Expose()
  address: string;

  @Expose()
  city: string;

  @Expose()
  isHeadquarters: boolean;
}

/**
 * Complete job detail response
 */
export class JobDetailDto {
  @Expose()
  id: string;

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
  @Type(() => JobEmployerDto)
  employer: JobEmployerDto;

  @Expose()
  @Type(() => JobCategoryDto)
  category: JobCategoryDto;

  @Expose()
  @Type(() => JobLocationDto)
  location: JobLocationDto;
}
