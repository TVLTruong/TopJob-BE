// src/modules/categories/categories.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobCategory, EmployerCategory } from '../../database/entities/';
import {
  CategoriesService,
  EmployerCategoriesService,
} from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JobCategory, EmployerCategory])],
  providers: [CategoriesService, EmployerCategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService, EmployerCategoriesService],
})
export class CategoriesModule {}
