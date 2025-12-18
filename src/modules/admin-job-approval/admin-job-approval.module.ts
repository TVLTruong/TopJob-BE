// src/modules/admin-job-approval/admin-job-approval.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job, ApprovalLog } from '../../database/entities';
import { AdminJobApprovalController } from './admin-job-approval.controller';
import { AdminJobApprovalService } from './admin-job-approval.service';
import { AuthModule } from '../auth/auth.module';

/**
 * Admin Job Approval Module
 * Handles job post approval workflow
 *
 * Features:
 * - View pending job posts
 * - Approve/reject job posts
 * - Maintain approval audit logs
 * - Email notifications (TODO)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Job, ApprovalLog]), AuthModule],
  controllers: [AdminJobApprovalController],
  providers: [AdminJobApprovalService],
  exports: [AdminJobApprovalService],
})
export class AdminJobApprovalModule {}
