// src/modules/admin/admin.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User, Employer, Job } from '../../database/entities';
import { UserRole, EmployerStatus, JobStatus } from '../../common/enums';
import {
  DashboardStatsDto,
  MonthlyUserGrowthDto,
  MonthlyJobPostingDto,
} from './dto/dashboard-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total counts
    const [totalCandidates, totalEmployers] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.CANDIDATE } }),
      this.userRepository.count({ where: { role: UserRole.EMPLOYER } }),
    ]);

    // Get new employers this month
    const newEmployersThisMonth = await this.userRepository.count({
      where: {
        role: UserRole.EMPLOYER,
        createdAt: MoreThanOrEqual(currentMonthStart),
      },
    });

    // Get pending employers
    const pendingEmployers = await this.employerRepository.count({
      where: {
        status: EmployerStatus.PENDING_APPROVAL,
      },
    });

    // Get job statistics
    const [totalJobPostings, newJobPostingsThisMonth, pendingJobPostings] =
      await Promise.all([
        this.jobRepository.count(),
        this.jobRepository.count({
          where: {
            createdAt: MoreThanOrEqual(currentMonthStart),
          },
        }),
        this.jobRepository.count({
          where: {
            status: JobStatus.PENDING_APPROVAL,
          },
        }),
      ]);

    // Get growth data for last 4 months
    const userGrowthData = await this.getUserGrowthData();
    const jobPostingData = await this.getJobPostingData();

    return {
      totalAccounts: totalCandidates + totalEmployers,
      totalCandidates,
      totalEmployers,
      newEmployersThisMonth,
      pendingEmployers,
      totalJobPostings,
      newJobPostingsThisMonth,
      pendingJobPostings,
      userGrowthData,
      jobPostingData,
    };
  }

  /**
   * Get user growth data for last 4 months
   */
  private async getUserGrowthData(): Promise<MonthlyUserGrowthDto[]> {
    const monthlyData: MonthlyUserGrowthDto[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

      // Count users created in this specific month
      const [candidates, employers] = await Promise.all([
        this.userRepository
          .createQueryBuilder('user')
          .where('user.role = :role', { role: UserRole.CANDIDATE })
          .andWhere('user.createdAt >= :start', { start: monthStart })
          .andWhere('user.createdAt <= :end', { end: monthEnd })
          .getCount(),
        this.userRepository
          .createQueryBuilder('user')
          .where('user.role = :role', { role: UserRole.EMPLOYER })
          .andWhere('user.createdAt >= :start', { start: monthStart })
          .andWhere('user.createdAt <= :end', { end: monthEnd })
          .getCount(),
      ]);

      monthlyData.push({
        month: `Tháng ${monthStart.getMonth() + 1}`,
        candidates,
        employers,
      });
    }

    return monthlyData;
  }

  /**
   * Get job posting data for last 4 months
   */
  private async getJobPostingData(): Promise<MonthlyJobPostingDto[]> {
    const monthlyData: MonthlyJobPostingDto[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

      // Count active jobs created in this specific month
      const active = await this.jobRepository
        .createQueryBuilder('job')
        .where('job.status = :status', { status: JobStatus.ACTIVE })
        .andWhere('job.createdAt >= :start', { start: monthStart })
        .andWhere('job.createdAt <= :end', { end: monthEnd })
        .getCount();

      monthlyData.push({
        month: `Tháng ${monthStart.getMonth() + 1}`,
        active,
      });
    }

    return monthlyData;
  }
}
