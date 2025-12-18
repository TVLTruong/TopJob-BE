// src/modules/admin-candidate-management/admin-candidate-management.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Candidate, Application } from '../../database/entities';
import { AdminCandidateManagementController } from './admin-candidate-management.controller';
import { AdminCandidateManagementService } from './admin-candidate-management.service';

/**
 * Admin Candidate Management Module
 * Domain-driven module for managing candidate accounts
 *
 * Features:
 * - View candidate list with search and filters
 * - View detailed candidate information
 * - Ban/unban candidate accounts
 * - Update candidate basic information
 * - Delete candidates with application validation
 * - Application statistics per candidate
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Candidate, Application])],
  controllers: [AdminCandidateManagementController],
  providers: [AdminCandidateManagementService],
  exports: [AdminCandidateManagementService],
})
export class AdminCandidateManagementModule {}
