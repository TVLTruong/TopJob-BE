// src/modules/admin-job-management/admin-job-management.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Job,
  Employer,
  JobCategory,
  EmployerLocation,
} from '../../database/entities';
import { AdminJobManagementController } from './admin-job-management.controller';
import { AdminJobManagementService } from './admin-job-management.service';

/**
 * Admin Job Management Module
 * Domain-driven module for managing job posts as admin
 *
 * Features:
 * - View all jobs with filtering (ACTIVE, PENDING, REJECTED)
 * - View detailed job information
 * - Force remove jobs (status = REMOVED_BY_ADMIN)
 * - Handle violation reports
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Employer, JobCategory, EmployerLocation]),
  ],
  controllers: [AdminJobManagementController],
  providers: [AdminJobManagementService],
  exports: [AdminJobManagementService],
})
export class AdminJobManagementModule {}
