// src/modules/admin-category/admin-category.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCategory, CompanyCategory } from '../../database/entities';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryService } from './admin-category.service';

/**
 * Admin Category Management Module
 * Domain-driven module for managing shared categories
 *
 * Features:
 * - Manage JobCategory and CompanyCategory
 * - CRUD operations with soft delete (isActive flag)
 * - Hide/Unhide categories
 * - Frontend dropdown auto-updates based on isActive
 */
@Module({
  imports: [TypeOrmModule.forFeature([JobCategory, CompanyCategory])],
  controllers: [AdminCategoryController],
  providers: [AdminCategoryService],
  exports: [AdminCategoryService],
})
export class AdminCategoryModule {}
