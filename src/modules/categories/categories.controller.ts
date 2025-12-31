// src/modules/categories/categories.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  CategoriesService,
  EmployerCategoriesService,
} from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { EmployerCategoryDto } from './dto/employer-category.dto';

@Controller('api/categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly employerCategoriesService: EmployerCategoriesService, // thêm service đúng
  ) {}

  @Get('job')
  getJobCategories(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getAllCategories();
  }

  @Get('employer')
  getEmployerCategories(): Promise<EmployerCategoryDto[]> {
    return this.employerCategoriesService.getAllEmployerCategories();
  }
}
