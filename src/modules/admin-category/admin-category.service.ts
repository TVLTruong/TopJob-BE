// src/modules/admin-category/admin-category.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { JobCategory, EmployerCategory } from '../../database/entities';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import {
  QueryCategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryType,
} from './dto';

/**
 * Admin Category Management Service
 * Domain-driven service for managing shared categories
 *
 * Features:
 * - Manage JobCategory and EmployerCategory
 * - CRUD operations with soft delete (isActive flag)
 * - Hide/Unhide categories without affecting old data
 * - Frontend dropdown automatically updates based on isActive
 */
@Injectable()
export class AdminCategoryService {
  private readonly logger = new Logger(AdminCategoryService.name);

  constructor(
    @InjectRepository(JobCategory)
    private readonly jobCategoryRepository: Repository<JobCategory>,
    @InjectRepository(EmployerCategory)
    private readonly EmployerCategoryRepository: Repository<EmployerCategory>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated list of categories with filters
   * Supports both JobCategory and EmployerCategory
   */
  async getCategoryList(
    query: QueryCategoryDto,
  ): Promise<PaginationResponseDto<JobCategory | EmployerCategory>> {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    try {
      if (!type) {
        throw new BadRequestException(
          'Type là bắt buộc. Chọn job_category hoặc company_category',
        );
      }

      let queryBuilder: SelectQueryBuilder<JobCategory | EmployerCategory>;
      let alias: string;

      if (type === CategoryType.JOB_CATEGORY) {
        alias = 'category';
        queryBuilder = this.jobCategoryRepository
          .createQueryBuilder(alias)
          .leftJoinAndSelect(`${alias}.parent`, 'parent')
          .leftJoinAndSelect(`${alias}.children`, 'children');
      } else {
        alias = 'category';
        queryBuilder =
          this.EmployerCategoryRepository.createQueryBuilder(alias);
      }

      // Search filter
      if (search) {
        queryBuilder.andWhere(
          `(${alias}.name ILIKE :search OR ${alias}.slug ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      // Active status filter
      if (isActive !== undefined) {
        queryBuilder.andWhere(`${alias}.isActive = :isActive`, { isActive });
      }

      // Sorting
      const sortField =
        sortBy === 'name' || sortBy === 'slug'
          ? `${alias}.${sortBy}`
          : `${alias}.createdAt`;
      queryBuilder.orderBy(sortField, sortOrder);

      // Execute with pagination
      const [categories, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data: categories,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in getCategoryList: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get detailed category information by ID and type
   */
  async getCategoryDetail(
    id: string,
    type: CategoryType,
  ): Promise<JobCategory | EmployerCategory> {
    let category: JobCategory | EmployerCategory | null;

    if (type === CategoryType.JOB_CATEGORY) {
      category = await this.jobCategoryRepository.findOne({
        where: { id },
        relations: ['parent', 'children'],
      });
    } else {
      category = await this.EmployerCategoryRepository.findOne({
        where: { id },
      });
    }

    if (!category) {
      throw new NotFoundException(
        `Không tìm thấy ${type === CategoryType.JOB_CATEGORY ? 'danh mục công việc' : 'danh mục công ty'} với ID: ${id}`,
      );
    }

    return category;
  }

  /**
   * Create new category
   * Validates slug uniqueness and parent existence for JobCategory
   */
  async createCategory(
    dto: CreateCategoryDto,
  ): Promise<JobCategory | EmployerCategory> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { type, name, slug, description, parentId } = dto;

      // Check slug uniqueness
      await this.validateSlugUniqueness(slug, type);

      if (type === CategoryType.JOB_CATEGORY) {
        // Validate parent if provided
        let parent: JobCategory | null = null;
        if (parentId) {
          parent = await this.jobCategoryRepository.findOne({
            where: { id: parentId },
          });
          if (!parent) {
            throw new NotFoundException(
              `Không tìm thấy danh mục cha với ID: ${parentId}`,
            );
          }
        }

        const jobCategory = this.jobCategoryRepository.create({
          name,
          slug,
          parentId: parentId || null,
          isActive: true,
        });

        const savedCategory = await queryRunner.manager.save(
          JobCategory,
          jobCategory,
        );
        await queryRunner.commitTransaction();

        this.logger.log(`Created JobCategory: ${savedCategory.id} - ${name}`);
        return savedCategory;
      } else {
        const EmployerCategory = this.EmployerCategoryRepository.create({
          name,
          slug,
          description: description || null,
          isActive: true,
        });

        const savedCategory = await queryRunner.manager.save(
          // EmployerCategory,
          EmployerCategory,
        );
        await queryRunner.commitTransaction();

        this.logger.log(
          `Created EmployerCategory: ${savedCategory.id} - ${name}`,
        );
        return savedCategory;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error in createCategory: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update category information
   * Only name, slug, and description can be updated
   */
  async updateCategory(
    id: string,
    type: CategoryType,
    dto: UpdateCategoryDto,
  ): Promise<JobCategory | EmployerCategory> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let category: JobCategory | EmployerCategory | null;

      if (type === CategoryType.JOB_CATEGORY) {
        category = await queryRunner.manager.findOne(JobCategory, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!category) {
          throw new NotFoundException(
            `Không tìm thấy danh mục công việc với ID: ${id}`,
          );
        }

        // Update fields
        if (dto.name !== undefined) category.name = dto.name;
        if (dto.slug !== undefined) {
          await this.validateSlugUniqueness(
            dto.slug,
            type,
            id,
            queryRunner.manager,
          );
          category.slug = dto.slug;
        }

        const updated = await queryRunner.manager.save(JobCategory, category);
        await queryRunner.commitTransaction();

        this.logger.log(`Updated JobCategory: ${id}`);
        return updated;
      } else {
        category = await queryRunner.manager.findOne(EmployerCategory, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!category) {
          throw new NotFoundException(
            `Không tìm thấy danh mục công ty với ID: ${id}`,
          );
        }

        // Update fields
        if (dto.name !== undefined) category.name = dto.name;
        if (dto.slug !== undefined) {
          await this.validateSlugUniqueness(
            dto.slug,
            type,
            id,
            queryRunner.manager,
          );
          category.slug = dto.slug;
        }
        if (dto.description !== undefined)
          category.description = dto.description;

        const updated = await queryRunner.manager.save(
          EmployerCategory,
          category,
        );
        await queryRunner.commitTransaction();

        this.logger.log(`Updated EmployerCategory: ${id}`);
        return updated;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error in updateCategory: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Hide category (soft delete)
   * Sets isActive = false
   * Old data using this category is not affected
   * Frontend dropdown will not show hidden categories
   */
  async hideCategory(id: string, type: CategoryType): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let category: JobCategory | EmployerCategory | null;

      if (type === CategoryType.JOB_CATEGORY) {
        category = await queryRunner.manager.findOne(JobCategory, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!category) {
          throw new NotFoundException(
            `Không tìm thấy danh mục công việc với ID: ${id}`,
          );
        }

        if (!category.isActive) {
          throw new BadRequestException('Danh mục đã bị ẩn trước đó');
        }

        category.isActive = false;
        await queryRunner.manager.save(JobCategory, category);
      } else {
        category = await queryRunner.manager.findOne(EmployerCategory, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!category) {
          throw new NotFoundException(
            `Không tìm thấy danh mục công ty với ID: ${id}`,
          );
        }

        if (!category.isActive) {
          throw new BadRequestException('Danh mục đã bị ẩn trước đó');
        }

        category.isActive = false;
        await queryRunner.manager.save(EmployerCategory, category);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Hidden ${type === CategoryType.JOB_CATEGORY ? 'JobCategory' : 'EmployerCategory'}: ${id} - ${category.name}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error in hideCategory: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unhide category (restore)
   * Sets isActive = true
   * Category becomes available in frontend dropdown again
   */
  async unhideCategory(id: string, type: CategoryType): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let category: JobCategory | EmployerCategory | null;

      if (type === CategoryType.JOB_CATEGORY) {
        category = await queryRunner.manager.findOne(JobCategory, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!category) {
          throw new NotFoundException(
            `Không tìm thấy danh mục công việc với ID: ${id}`,
          );
        }

        if (category.isActive) {
          throw new BadRequestException('Danh mục đang hoạt động');
        }

        category.isActive = true;
        await queryRunner.manager.save(JobCategory, category);
      } else {
        category = await queryRunner.manager.findOne(EmployerCategory, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!category) {
          throw new NotFoundException(
            `Không tìm thấy danh mục công ty với ID: ${id}`,
          );
        }

        if (category.isActive) {
          throw new BadRequestException('Danh mục đang hoạt động');
        }

        category.isActive = true;
        await queryRunner.manager.save(EmployerCategory, category);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Unhidden ${type === CategoryType.JOB_CATEGORY ? 'JobCategory' : 'EmployerCategory'}: ${id} - ${category.name}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error in unhideCategory: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate slug uniqueness
   * Private helper method
   */
  private async validateSlugUniqueness(
    slug: string,
    type: CategoryType,
    excludeId?: string,
    manager?: DataSource['manager'],
  ): Promise<void> {
    const repo = manager || this.dataSource.manager;

    if (type === CategoryType.JOB_CATEGORY) {
      const existing = await repo.findOne(JobCategory, {
        where: { slug },
      });

      if (existing && existing.id !== excludeId) {
        throw new ConflictException(
          `Slug "${slug}" đã tồn tại trong JobCategory`,
        );
      }
    } else {
      const existing = await repo.findOne(EmployerCategory, {
        where: { slug },
      });

      if (existing && existing.id !== excludeId) {
        throw new ConflictException(
          `Slug "${slug}" đã tồn tại trong EmployerCategory`,
        );
      }
    }
  }
}
