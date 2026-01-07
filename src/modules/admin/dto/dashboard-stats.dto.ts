// src/modules/admin/dto/dashboard-stats.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Monthly growth data for users
 */
export class MonthlyUserGrowthDto {
  @ApiProperty({ example: 'Tháng 1' })
  @Expose()
  month: string;

  @ApiProperty({ example: 92 })
  @Expose()
  candidates: number;

  @ApiProperty({ example: 28 })
  @Expose()
  employers: number;
}

/**
 * Monthly job posting data
 */
export class MonthlyJobPostingDto {
  @ApiProperty({ example: 'Tháng 1' })
  @Expose()
  month: string;

  @ApiProperty({ example: 82 })
  @Expose()
  active: number;
}

/**
 * Dashboard statistics response
 */
export class DashboardStatsDto {
  // User statistics
  @ApiProperty({ example: 580 })
  @Expose()
  totalAccounts: number;

  @ApiProperty({ example: 458 })
  @Expose()
  totalCandidates: number;

  @ApiProperty({ example: 122 })
  @Expose()
  totalEmployers: number;

  @ApiProperty({ example: 22 })
  @Expose()
  newEmployersThisMonth: number;

  @ApiProperty({ example: 18 })
  @Expose()
  pendingEmployers: number;

  // Job statistics
  @ApiProperty({ example: 324 })
  @Expose()
  totalJobPostings: number;

  @ApiProperty({ example: 95 })
  @Expose()
  newJobPostingsThisMonth: number;

  @ApiProperty({ example: 24 })
  @Expose()
  pendingJobPostings: number;

  // Growth data
  @ApiProperty({ type: [MonthlyUserGrowthDto] })
  @Expose()
  userGrowthData: MonthlyUserGrowthDto[];

  @ApiProperty({ type: [MonthlyJobPostingDto] })
  @Expose()
  jobPostingData: MonthlyJobPostingDto[];
}
