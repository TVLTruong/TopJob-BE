// src/modules/admin-candidate-management/dto/candidate-detail.dto.ts

import { Expose, Type } from 'class-transformer';
import {
  UserRole,
  UserStatus,
  Gender,
  EducationLevel,
  ExperienceLevel,
} from '../../../common/enums';

/**
 * User information in candidate detail
 */
export class CandidateUserInfoDto {
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
 * Candidate profile information
 */
export class CandidateProfileInfoDto {
  @Expose()
  id: string;

  @Expose()
  fullName: string;

  @Expose()
  gender: Gender | null;

  @Expose()
  dateOfBirth: Date | null;

  @Expose()
  phoneNumber: string | null;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  bio: string | null;

  @Expose()
  personalUrl: string | null;

  @Expose()
  addressStreet: string | null;

  @Expose()
  addressDistrict: string | null;

  @Expose()
  addressCity: string | null;

  @Expose()
  addressCountry: string | null;

  @Expose()
  educationLevel: EducationLevel | null;

  @Expose()
  experienceLevel: ExperienceLevel | null;

  @Expose()
  skills: string[] | null;

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

  @Expose()
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate?: string;
    currentlyWorking: boolean;
    description?: string;
  }> | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

/**
 * Candidate CV information
 */
export class CandidateCvDto {
  @Expose()
  id: string;

  @Expose()
  fileName: string;

  @Expose()
  fileUrl: string;

  @Expose()
  fileSize: number;

  @Expose()
  uploadedAt: Date;

  @Expose()
  isDefault: boolean;
}

/**
 * Application statistics for candidate
 */
export class CandidateApplicationStatsDto {
  @Expose()
  totalApplications: number;

  @Expose()
  newApplications: number;

  @Expose()
  viewedApplications: number;

  @Expose()
  shortlistedApplications: number;

  @Expose()
  hiredApplications: number;

  @Expose()
  rejectedApplications: number;
}

/**
 * Complete candidate detail response
 */
export class CandidateDetailResponseDto {
  @Expose()
  @Type(() => CandidateUserInfoDto)
  user: CandidateUserInfoDto;

  @Expose()
  @Type(() => CandidateProfileInfoDto)
  profile: CandidateProfileInfoDto;

  @Expose()
  @Type(() => CandidateApplicationStatsDto)
  applicationStats: CandidateApplicationStatsDto;

  @Expose()
  @Type(() => CandidateCvDto)
  cvs: CandidateCvDto[];
}
