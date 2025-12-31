// src/modules/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { JobCategory, EmployerCategory } from '../../database/entities';
import { CategoryResponseDto } from './dto/category-response.dto';
import { EmployerCategoryDto } from './dto/employer-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(JobCategory)
    private readonly categoryRepository: TreeRepository<JobCategory>, // TreeRepository để quản lý parent/children
  ) {}

  async getAllCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      relations: ['parent'],
    }); // include parent
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parent ? cat.parent.id : null,
    }));
  }
}

@Injectable()
export class EmployerCategoriesService {
  constructor(
    @InjectRepository(EmployerCategory)
    private readonly repository: Repository<EmployerCategory>,
  ) {}

  async getAllEmployerCategories(): Promise<EmployerCategoryDto[]> {
    const categories = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    // map entity -> DTO
    return categories.map(
      (cat) =>
        new EmployerCategoryDto({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        }),
    );
  }
}
