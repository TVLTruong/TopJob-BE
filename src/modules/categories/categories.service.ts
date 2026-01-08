// src/modules/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import {
  JobCategory,
  EmployerCategory,
  Technology,
} from '../../database/entities';
import { CategoryResponseDto } from './dto/category-response.dto';
import { EmployerCategoryDto } from './dto/employer-category.dto';
import { TechnologyResponseDto } from './dto/technology-response.dto';

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

  async getRandomCategories(limit: number = 5): Promise<CategoryResponseDto[]> {
    // Get all active root categories (no parent)
    const categories = await this.categoryRepository.find({
      where: { parent: null as any },
      order: { name: 'ASC' },
    });

    // Shuffle and take limit
    const shuffled = categories.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(limit, categories.length));

    return selected.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parentId: null,
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

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectRepository(Technology)
    private readonly repository: Repository<Technology>,
  ) {}

  async getAllTechnologies(): Promise<TechnologyResponseDto[]> {
    const technologies = await this.repository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return technologies.map(
      (tech) =>
        new TechnologyResponseDto({
          id: tech.id,
          name: tech.name,
          slug: tech.slug,
          isActive: tech.isActive,
        }),
    );
  }
}
