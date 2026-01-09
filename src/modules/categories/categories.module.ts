// src/modules/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  JobCategory,
  EmployerCategory,
  Technology,
} from '../../database/entities/';
import {
  CategoriesService,
  EmployerCategoriesService,
  TechnologiesService,
} from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobCategory, EmployerCategory, Technology]),
  ],
  providers: [
    CategoriesService,
    EmployerCategoriesService,
    TechnologiesService,
  ],
  controllers: [CategoriesController],
  exports: [CategoriesService, EmployerCategoriesService, TechnologiesService],
})
export class CategoriesModule {}
