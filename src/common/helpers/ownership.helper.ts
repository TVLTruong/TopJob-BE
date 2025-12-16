// src/common/helpers/ownership.helper.ts

import { NotFoundException } from '@nestjs/common';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

/**
 * Ownership Helper - Production Ready
 *
 * Quy tắc:
 * - Ownership PHẢI được kiểm tra bằng query (JOIN/WHERE)
 * - Sai ownership => NotFoundException (không Forbidden)
 * - Không tin ID từ client
 * - Type-safe (không dùng any)
 * - Reusable cho nhiều service
 * - Không xử lý nghiệp vụ
 */

/**
 * Kiểm tra ownership trực tiếp (entity có trường userId/candidateId/employerId)
 *
 * @example
 * // Candidate owns CandidateCV
 * const cv = await OwnershipHelper.verifyDirectOwnership(
 *   this.candidateCvRepository,
 *   cvId,
 *   'candidateId',
 *   candidateId,
 *   'CV'
 * );
 *
 * @example
 * // Employer owns Job
 * const job = await OwnershipHelper.verifyDirectOwnership(
 *   this.jobRepository,
 *   jobId,
 *   'employerId',
 *   employerId,
 *   'Job'
 * );
 */
export class OwnershipHelper {
  /**
   * Verify direct ownership (entity có foreign key trực tiếp)
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID (vd: 'userId', 'candidateId', 'employerId')
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  static async verifyDirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
  ): Promise<T> {
    // Query với WHERE clause kiểm tra cả ID và ownership
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
   * // Candidate owns Application (Application -> Candidate)
   * const application = await OwnershipHelper.verifyIndirectOwnership(
   *   this.applicationRepository,
   *   applicationId,
   *   'candidate',
   *   'candidateId',
   *   candidateId,
   *   'Application'
   * );
   *
   * @example
   * // Employer owns Application (Application -> Job -> Employer)
   * const qb = this.applicationRepository
   *   .createQueryBuilder('app')
   *   .innerJoin('app.job', 'job')
   *   .where('app.id = :appId', { appId: applicationId })
   *   .andWhere('job.employerId = :employerId', { employerId });
   *
   * const application = await OwnershipHelper.verifyWithCustomQuery(
   *   qb,
   *   'Application'
   * );
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param relationName - Tên relation để JOIN (vd: 'candidate', 'job')
   * @param relationOwnerField - Field trong relation chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  static async verifyIndirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    relationName: string,
    relationOwnerField: string,
    ownerId: string,
    entityName: string,
  ): Promise<T> {
    // Query builder với JOIN để kiểm tra ownership
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
   * Dùng khi cần logic phức tạp hơn (multi-level JOIN, conditions...)
   *
   * @example
   * // Employer owns Application (qua Job)
   * const qb = this.applicationRepository
   *   .createQueryBuilder('app')
   *   .innerJoin('app.job', 'job')
   *   .where('app.id = :appId', { appId: applicationId })
   *   .andWhere('job.employerId = :employerId', { employerId });
   *
   * const application = await OwnershipHelper.verifyWithCustomQuery(qb, 'Application');
   *
   * @param queryBuilder - Custom query builder đã setup sẵn WHERE và JOIN
   * @param entityName - Tên entity để hiển thị trong error message
   * @returns Entity nếu ownership hợp lệ
   * @throws NotFoundException nếu không tìm thấy hoặc không phải owner
   */
  static async verifyWithCustomQuery<T extends ObjectLiteral>(
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
   * const job = await OwnershipHelper.verifyDirectOwnershipWithRelations(
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
  static async verifyDirectOwnershipWithRelations<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
    relations: string[],
  ): Promise<T> {
    // Query với WHERE clause kiểm tra ownership + load relations
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
   * Check ownership KHÔNG throw exception (dùng trong điều kiện phức tạp)
   * Chỉ dùng khi cần kiểm tra ownership như một phần của logic phức tạp
   *
   * @example
   * const isOwner = await OwnershipHelper.checkDirectOwnership(
   *   this.jobRepository,
   *   jobId,
   *   'employerId',
   *   employerId
   * );
   *
   * if (!isOwner && !isAdmin) {
   *   throw new ForbiddenException('Access denied');
   * }
   *
   * @param repository - TypeORM repository
   * @param entityId - ID của entity cần check
   * @param ownerField - Tên field chứa owner ID
   * @param ownerId - ID của owner hiện tại
   * @returns true nếu là owner, false nếu không
   */
  static async checkDirectOwnership<T extends ObjectLiteral>(
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
   * await OwnershipHelper.verifyBulkDirectOwnership(
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
  static async verifyBulkDirectOwnership<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityIds: string[],
    ownerField: keyof T,
    ownerId: string,
    entityName: string,
  ): Promise<void> {
    if (entityIds.length === 0) {
      return;
    }

    // Count entities thuộc owner
    const count = await repository
      .createQueryBuilder('entity')
      .where('entity.id IN (:...entityIds)', { entityIds })
      .andWhere(`entity.${String(ownerField)} = :ownerId`, { ownerId })
      .getCount();

    // Nếu count không khớp => có entity không thuộc owner
    if (count !== entityIds.length) {
      throw new NotFoundException(`Some ${entityName} not found`);
    }
  }

  /**
   * Get entity với ownership check VÀ thêm conditions
   *
   * @example
   * // Chỉ lấy job ACTIVE của employer
   * const job = await OwnershipHelper.verifyDirectOwnershipWithConditions(
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
  static async verifyDirectOwnershipWithConditions<T extends ObjectLiteral>(
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
}
