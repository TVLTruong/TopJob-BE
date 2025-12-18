// src/modules/admin-employer-approval/admin-employer-approval.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Employer,
  EmployerPendingEdit,
  ApprovalLog,
} from '../../database/entities';
import { AdminEmployerApprovalController } from './admin-employer-approval.controller';
import { AdminEmployerApprovalService } from './admin-employer-approval.service';

/**
 * Admin Employer Approval Module
 * Handles employer profile approval workflow
 *
 * Features:
 * - View pending employer profiles
 * - Approve/reject new employer registrations
 * - Approve/reject employer profile edits
 * - Maintain approval audit logs
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Employer,
      EmployerPendingEdit,
      ApprovalLog,
    ]),
  ],
  controllers: [AdminEmployerApprovalController],
  providers: [AdminEmployerApprovalService],
  exports: [AdminEmployerApprovalService],
})
export class AdminEmployerApprovalModule {}
