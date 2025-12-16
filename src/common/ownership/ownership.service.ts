// src/common/ownership/ownership.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

/**
 * Ownership Service
 *
 * Mục tiêu: kiểm tra quyền sở hữu ở tầng query.
 *
 * Quy tắc chính:
 * - Luôn kiểm tra bằng JOIN/WHERE.
 * - Sai ownership trả về NotFoundException.
 * - Không tin ID từ client.
 * - Type-safe, không dùng any.
 * - Không expose query logic ra ngoài.
 *
 * Hướng dẫn JOIN:
 * - innerJoin: chỉ để xác thực ownership.
 * - leftJoinAndSelect: dùng trong business logic khi cần relations.
 * - Tránh lặp lại cùng một ownership query trong một request; tái sử dụng entity đã xác thực.
 */
@Injectable()
export class OwnershipService {
  /**
   * Verify direct ownership (entity có foreign key trực tiếp)
   *
   * @example
   * // Trong CandidateCvsService
   * const cv = await this.ownershipService.verifyDirectOwnership(
   *   this.candidateCvRepository,
   *   cvId,
   *   'candidateId',
   *   candidateId,
   *   'CV'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID (vd: 'userId', 'candidateId', 'employerId')
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async verifyDirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
  ): Promise<T> {
    const entity = await repository
      .createQueryBuilder('entity')
      .where('entity.id = :entityId', { entityId })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Verify indirect ownership (qua JOIN)
   *
   * @example
   * // Application -> Candidate
   * const application = await this.ownershipService.verifyIndirectOwnership(
   *   this.applicationRepository,
   *   applicationId,
   *   'candidate',
   *   'id',
   *   candidateId,
   *   'Application'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param relationName - Tên relation để JOIN
   * @param relationOwnerField - Field trong relation chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async verifyIndirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    relationName: string,
    relationOwnerField: string,
    ownerId: string,
    entityName: string,
  ): Promise<T> {
    const entity = await repository
      .createQueryBuilder('entity')
      .innerJoin(`entity.${relationName}`, 'owner')
      .where('entity.id = :entityId', { entityId })
      .andWhere(`owner.${relationOwnerField} = :ownerId`, { ownerId })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Verify ownership với custom query builder
   * Dùng khi cần logic phức tạp (multi-level JOIN, conditions...)
   *
   * @example
   * // Employer owns Application (qua Job)
   * const qb = this.applicationRepository
   *   .createQueryBuilder('app')
   *   .innerJoin('app.job', 'job')
   *   .where('app.id = :appId', { appId: applicationId })
   *   .andWhere('job.employerId = :employerId', { employerId });
   *
   * const app = await this.ownershipService.verifyWithCustomQuery(qb, 'Application');
   *
   * @param queryBuilder - Custom query builder đã setup WHERE và JOIN
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async verifyWithCustomQuery<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    entityName: string,
  ): Promise<T> {
    const entity = await queryBuilder.getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Verify ownership và SELECT các relations cần thiết
   *
   * @example
   * const job = await this.ownershipService.verifyDirectOwnershipWithRelations(
   *   this.jobRepository,
   *   jobId,
   *   'employerId',
   *   employerId,
   *   'Job',
   *   ['category', 'location']
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @param relations - Array các relations cần load
   * @returns Entity với relations nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async verifyDirectOwnershipWithRelations<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
    relations: string[],
  ): Promise<T> {
    let query = repository
      .createQueryBuilder('entity')
      .where('entity.id = :entityId', { entityId })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId });

    // Load relations
    relations.forEach((relation) => {
      query = query.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    const entity = await query.getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Verify ownership với additional conditions
   *
   * @example
   * // Chỉ lấy job ACTIVE của employer
   * const job = await this.ownershipService.verifyDirectOwnershipWithConditions(
   *   this.jobRepository,
   *   jobId,
   *   'employerId',
   *   employerId,
   *   { status: JobStatus.ACTIVE },
   *   'Active Job'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param additionalConditions - Thêm điều kiện WHERE
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu tất cả conditions đều pass
   * @throws NotFoundException nếu không tìm thấy
   */
  async verifyDirectOwnershipWithConditions<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    additionalConditions: Partial<T>,
    entityName: string,
  ): Promise<T> {
    let query = repository
      .createQueryBuilder('entity')
      .where('entity.id = :entityId', { entityId })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId });

    // Add additional conditions
    Object.keys(additionalConditions).forEach((key) => {
      const paramName = `condition_${key}`;
      const value = additionalConditions[key as keyof T];
      query = query.andWhere(`entity.${key} = :${paramName}`, {
        [paramName]: value,
      });
    });

    const entity = await query.getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Check ownership KHÔNG throw exception
   * Chỉ dùng khi cần kiểm tra ownership như một phần của logic phức tạp
   *
   * @example
   * const isOwner = await this.ownershipService.checkDirectOwnership(
   *   this.jobRepository,
   *   jobId,
   *   'employerId',
   *   employerId
   * );
   *
   * if (!isOwner && !isAdmin) {
   *   throw new ForbiddenException();
   * }
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @returns true nếu là owner, false nếu không
   */
  async checkDirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
  ): Promise<boolean> {
    const count = await repository
      .createQueryBuilder('entity')
      .where('entity.id = :entityId', { entityId })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId })
      .getCount();

    return count > 0;
  }

  /**
   * Verify ownership cho bulk operations
   * Đảm bảo TẤT CẢ entities đều thuộc về owner
   *
   * @example
   * await this.ownershipService.verifyBulkDirectOwnership(
   *   this.candidateCvRepository,
   *   cvIds,
   *   'candidateId',
   *   candidateId,
   *   'CVs'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityIds - Array IDs của entities cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @throws NotFoundException nếu có bất kỳ entity nào không thuộc owner
   */
  async verifyBulkDirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityIds: string[],
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
  ): Promise<void> {
    if (entityIds.length === 0) {
      return;
    }

    const count = await repository
      .createQueryBuilder('entity')
      .where('entity.id IN (:...entityIds)', { entityIds })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId })
      .getCount();

    if (count !== entityIds.length) {
      throw new NotFoundException(`Some ${entityName} not found`);
    }
  }

  /**
   * Verify ownership và trả về entity với SELECT fields cụ thể
   * Tối ưu performance khi chỉ cần một số fields
   *
   * @example
   * const job = await this.ownershipService.verifyDirectOwnershipWithSelect(
   *   this.jobRepository,
   *   jobId,
   *   'employerId',
   *   employerId,
   *   'Job',
   *   ['id', 'title', 'status']
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @param selectFields - Array các fields cần SELECT
   * @returns Entity với các fields đã chọn
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async verifyDirectOwnershipWithSelect<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
    selectFields: (keyof T)[],
  ): Promise<T> {
    const alias = 'entity';
    const selectArray = selectFields.map(
      (field) => `${alias}.${String(field)}`,
    );

    const entity = await repository
      .createQueryBuilder(alias)
      .select(selectArray)
      .where(`${alias}.id = :entityId`, { entityId })
      .andWhere(`${alias}.${String(ownerField)} = :ownerId`, { ownerId })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Verify ownership với soft delete support
   * Kiểm tra cả entities đã bị soft delete
   *
   * @example
   * const job = await this.ownershipService.verifyDirectOwnershipIncludingDeleted(
   *   this.jobRepository,
   *   jobId,
   *   'employerId',
   *   employerId,
   *   'Job'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ (kể cả đã bị soft delete)
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async verifyDirectOwnershipIncludingDeleted<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
  ): Promise<T> {
    const entity = await repository
      .createQueryBuilder('entity')
      .withDeleted()
      .where('entity.id = :entityId', { entityId })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Count entities thuộc owner (không load entities)
   * Dùng cho pagination hoặc kiểm tra số lượng
   *
   * @example
   * const cvCount = await this.ownershipService.countByOwnership(
   *   this.candidateCvRepository,
   *   'candidateId',
   *   candidateId
   * );
   *
   * @param repository - TypeORM repository
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @returns Số lượng entities thuộc owner
   */
  async countByOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    ownerField: keyof T,
    ownerId: string,
  ): Promise<number> {
    return repository
      .createQueryBuilder('entity')
      .where(`entity.${String(ownerField)} = :ownerId`, { ownerId })
      .getCount();
  }

  /**
   * Verify ownership cho nested resources
   * Ví dụ: /employers/:employerId/locations/:locationId
   *
   * @example
   * const location = await this.ownershipService.verifyNestedOwnership(
   *   this.employerLocationRepository,
   *   locationId,
   *   'id',
   *   { employerId },
   *   'Employer Location'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param entityIdField - Field chứa entity ID (thường là 'id')
   * @param ownershipConditions - Object chứa các điều kiện ownership
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy
   */
  async verifyNestedOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    entityIdField: keyof T,
    ownershipConditions: Partial<T>,
    entityName: string,
  ): Promise<T> {
    let query = repository
      .createQueryBuilder('entity')
      .where(`entity.${String(entityIdField)} = :entityId`, { entityId });

    // Add ownership conditions
    Object.keys(ownershipConditions).forEach((key) => {
      const paramName = `condition_${key}`;
      const value = ownershipConditions[key as keyof T];
      query = query.andWhere(`entity.${key} = :${paramName}`, {
        [paramName]: value,
      });
    });

    const entity = await query.getOne();

    if (!entity) {
      throw new NotFoundException(`${entityName} not found`);
    }

    return entity;
  }

  /**
   * Assert employer profile owned by user
   * Query employer theo userId (không tin employerId từ client)
   *
   * @example
   * // Trong EmployersService
   * const employer = await this.ownershipService.assertEmployerProfileOwnedByUser(
   *   this.employerRepository,
   *   userId
   * );
   *
   * @param repository - Employer repository
   * @param userId - ID của user đã authenticated
   * @returns Employer entity nếu tìm thấy
   * @throws NotFoundException nếu user chưa có employer profile
   */
  async assertEmployerProfileOwnedByUser<T extends ObjectLiteral>(
    repository: Repository<T>,
    userId: string,
  ): Promise<T> {
    const employer = await repository
      .createQueryBuilder('entity')
      .where('entity.userId = :userId', { userId })
      .getOne();

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    return employer;
  }

  /**
   *
   * @param repository - Job repository
   * @param jobId - ID của job cần verify
   * @param userId - ID của user đã authenticated
   * @returns Job entity nếu user sở hữu job (qua employer profile)
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async assertJobOwnedByEmployer<T extends ObjectLiteral>(
    repository: Repository<T>,
    jobId: string,
    userId: string,
  ): Promise<T> {
    // JOIN job -> employer, verify theo userId
    const job = await repository
      .createQueryBuilder('job')
      .innerJoin('job.employer', 'employer')
      .where('job.id = :jobId', { jobId })
      .andWhere('employer.userId = :userId', { userId })
      .getOne();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  /**
   *
   * @param repository - Application repository
   * @param applicationId - ID của application cần verify
   * @param userId - ID của user đã authenticated
   * @returns Application entity nếu user sở hữu application (qua employer profile)
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  async assertApplicationOwnedByEmployer<T extends ObjectLiteral>(
    repository: Repository<T>,
    applicationId: string,
    userId: string,
  ): Promise<T> {
    // Multi-level JOIN: application -> job -> employer, verify theo userId
    const application = await repository
      .createQueryBuilder('application')
      .innerJoin('application.job', 'job')
      .innerJoin('job.employer', 'employer')
      .where('application.id = :applicationId', { applicationId })
      .andWhere('employer.userId = :userId', { userId })
      .getOne();

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  /**
   * Check if job belongs to employer (no exception)
   * Dùng cho filtering query (Talent Pool) - không throw exception
   *
   * @example
   * // Trong ApplicationsService - filter applications by employer's jobs
   * const validJobId = await this.ownershipService.assertJobBelongsToEmployerOrIgnore(
   *   this.jobRepository,
   *   jobId,
   *   userId
   * );
   *
   * if (validJobId) {
   *   query.andWhere('application.jobId = :jobId', { jobId: validJobId });
   * }
   *
   * @param repository - Job repository
   * @param jobId - ID của job cần check
   * @param userId - ID của user đã authenticated
   * @returns jobId nếu job thuộc employer, null nếu không thuộc
   */
  async assertJobBelongsToEmployerOrIgnore<T extends ObjectLiteral>(
    repository: Repository<T>,
    jobId: string,
    userId: string,
  ): Promise<string | null> {
    // Query job với JOIN employer, không throw exception
    const job = await repository
      .createQueryBuilder('job')
      .innerJoin('job.employer', 'employer')
      .where('job.id = :jobId', { jobId })
      .andWhere('employer.userId = :userId', { userId })
      .getOne();

    // Return jobId nếu thuộc employer, null nếu không
    return job ? jobId : null;
  }
}
