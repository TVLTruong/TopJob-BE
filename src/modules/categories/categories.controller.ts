// src/modules/categories/categories.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  CategoriesService,
  EmployerCategoriesService,
  TechnologiesService,
} from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { EmployerCategoryDto } from './dto/employer-category.dto';
import { TechnologyResponseDto } from './dto/technology-response.dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly employerCategoriesService: EmployerCategoriesService,
    private readonly technologiesService: TechnologiesService,
  ) {}

  @Get('job/random')
  getRandomJobCategories(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getRandomCategories(5);
  }

  @Get('job')
  getJobCategories(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.getAllCategories();
  }

  @Get('employer')
  getEmployerCategories(): Promise<EmployerCategoryDto[]> {
    return this.employerCategoriesService.getAllEmployerCategories();
  }

  @Get('technology')
  getTechnologies(): Promise<TechnologyResponseDto[]> {
    return this.technologiesService.getAllTechnologies();
  }
}
