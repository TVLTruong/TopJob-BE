// src/modules/admin-employer-management/admin-employer-management.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Employer, Job } from '../../database/entities';
import { AdminEmployerManagementController } from './admin-employer-management.controller';
import { AdminEmployerManagementService } from './admin-employer-management.service';

/**
 * Admin Employer Management Module
 * Domain-driven module for managing employer accounts
 *
 * Features:
 * - View employer list with search and filters
 * - View detailed employer information
 * - Ban/unban employer accounts
 * - Delete employer accounts with cascade
 * - Job statistics per employer
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Employer, Job])],
  controllers: [AdminEmployerManagementController],
  providers: [AdminEmployerManagementService],
  exports: [AdminEmployerManagementService],
})
export class AdminEmployerManagementModule {}
