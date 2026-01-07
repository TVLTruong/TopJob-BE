// src/modules/admin-job-management/admin-job-management.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Job, Employer } from '../../database/entities';
import { JobStatus } from '../../common/enums';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import {
  QueryJobDto,
  JobDetailDto,
  RemoveJobDto,
  JobEmployerInfoDto,
  JobCategoryInfoDto,
  JobLocationInfoDto,
} from './dto';

/**
 * Admin Job Management Service
 * Domain-driven service for managing job posts as admin
 *
 * Features:
 * - View all jobs with filtering (ACTIVE, PENDING, REJECTED)
 * - View detailed job information with employer, category, location
 * - Force remove ACTIVE jobs (status = REMOVED_BY_ADMIN)
 * - Optional removal reason tracking
 * - Transaction-safe operations with pessimistic locking
 */
@Injectable()
export class AdminJobManagementService {
  private readonly logger = new Logger(AdminJobManagementService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated list of jobs with search and filters
   * Admin can view all job statuses: ACTIVE, PENDING_APPROVAL, REJECTED, etc.
   */
  async getJobList(query: QueryJobDto): Promise<PaginationResponseDto<any>> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.employer', 'employer')
        .leftJoinAndSelect('job.jobCategories', 'jobCategory')
        .leftJoinAndSelect('jobCategory.category', 'category')
        .leftJoinAndSelect('job.location', 'location');

      // Search filter: title, company name, location
      if (search) {
        queryBuilder.andWhere(
          '(job.title ILIKE :search OR employer.companyName ILIKE :search OR location.city ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Status filter
      if (status) {
        queryBuilder.andWhere('job.status = :status', { status });
      }

      // Sorting
      const sortField = sortBy === 'title' ? 'job.title' : `job.${sortBy}`;
      queryBuilder.orderBy(sortField, sortOrder);

      // Execute with pagination
      const [jobs, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      // Transform to response DTOs
      const data = jobs.map((job) => {
        const employerInfo = plainToInstance(JobEmployerInfoDto, job.employer, {
          excludeExtraneousValues: true,
        });

        const categories =
          job.jobCategories
            ?.map((jc) => jc.category)
            .filter(Boolean)
            .map((cat) =>
              plainToInstance(JobCategoryInfoDto, cat, {
                excludeExtraneousValues: true,
              }),
            ) ?? [];

        const locationInfo = plainToInstance(JobLocationInfoDto, job.location, {
          excludeExtraneousValues: true,
        });

        return {
          id: job.id,
          title: job.title,
          slug: job.slug,
          status: job.status,
          employmentType: job.employmentType,
          workMode: job.workMode,
          quantity: job.quantity,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          isNegotiable: job.isNegotiable,
          isSalaryVisible: job.isSalaryVisible,
          salaryCurrency: job.salaryCurrency,
          expiredAt: job.expiredAt,
          publishedAt: job.publishedAt,
          applyCount: job.applyCount,
          viewCount: job.viewCount,
          saveCount: job.saveCount,
          isHot: job.isHot,
          isUrgent: job.isUrgent,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          employer: employerInfo,
          categories,
          location: locationInfo,
        };
      });

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in getJobList: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Get detailed job information by ID
   * Returns complete job data with employer, category, and location
   */
  async getJobDetail(jobId: string): Promise<JobDetailDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: [
        'employer',
        'jobCategories',
        'jobCategories.category',
        'location',
      ],
    });

    if (!job) {
      throw new NotFoundException(`Không tìm thấy job với ID: ${jobId}`);
    }

    // Transform employer info
    const employerInfo = plainToInstance(JobEmployerInfoDto, job.employer, {
      excludeExtraneousValues: true,
    });

    // Transform categories info
    const categories =
      job.jobCategories
        ?.map((jc) => jc.category)
        .filter(Boolean)
        .map((cat) =>
          plainToInstance(JobCategoryInfoDto, cat, {
            excludeExtraneousValues: true,
          }),
        ) ?? [];

    // Transform location info
    const locationInfo = plainToInstance(JobLocationInfoDto, job.location, {
      excludeExtraneousValues: true,
    });

    // Create detailed response
    return {
      id: job.id,
      employerId: job.employerId,
      locationId: job.locationId,
      title: job.title,
      slug: job.slug,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,
      niceToHave: job.niceToHave,
      benefits: job.benefits,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      isNegotiable: job.isNegotiable,
      isSalaryVisible: job.isSalaryVisible,
      salaryCurrency: job.salaryCurrency,
      employmentType: job.employmentType,
      workMode: job.workMode,
      experienceLevel: job.experienceLevel,
      experienceYearsMin: job.experienceYearsMin,
      quantity: job.quantity,
      status: job.status,
      expiredAt: job.expiredAt,
      publishedAt: job.publishedAt,
      applyCount: job.applyCount,
      viewCount: job.viewCount,
      saveCount: job.saveCount,
      isHot: job.isHot,
      isUrgent: job.isUrgent,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      employer: employerInfo,
      categories,
      location: locationInfo,
    };
  }

  /**
   * Force remove job by admin
   * Changes status to REMOVED_BY_ADMIN, job is hidden from candidates immediately
   * Suitable for handling violation reports
   *
   * Business rules:
   * - Can remove jobs with any status (typically ACTIVE)
   * - Sets status to REMOVED_BY_ADMIN
   * - Optional removal reason for audit trail
   * - Job becomes invisible to candidates
   * - Employer cannot undo this action
   */
  async removeJob(
    jobId: string,
    adminId: string,
    dto: RemoveJobDto,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock job record for update
      const job = await queryRunner.manager.findOne(Job, {
        where: { id: jobId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!job) {
        throw new NotFoundException(`Không tìm thấy job với ID: ${jobId}`);
      }

      // Validate: already removed
      if (job.status === JobStatus.REMOVED_BY_ADMIN) {
        throw new BadRequestException('Job đã bị gỡ bởi admin trước đó');
      }

      // Update job status
      job.status = JobStatus.REMOVED_BY_ADMIN;
      await queryRunner.manager.save(Job, job);

      await queryRunner.commitTransaction();

      const reasonLog = dto.reason ? ` Lý do: ${dto.reason}` : '';
      this.logger.log(
        `Admin ${adminId} removed job ${jobId} (${job.title}).${reasonLog}`,
      );

      // TODO: Send email notification to employer about job removal
      // TODO: Log removal action to audit trail with reason
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error in removeJob: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Toggle job hot status (isHot flag)
   * Only ACTIVE jobs can be marked as hot
   */
  async toggleJobHot(jobId: string, isHot: boolean): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Không tìm thấy job với ID: ${jobId}`);
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ có thể đặt tin nổi bật cho tin đang hoạt động',
      );
    }

    job.isHot = isHot;
    await this.jobRepository.save(job);

    this.logger.log(`Job ${jobId} hot status changed to ${isHot}`);
  }

  /**
   * Restore removed job back to HIDDEN status
   * Can restore REMOVED_BY_ADMIN or REMOVED_BY_EMPLOYER
   */
  async restoreJob(jobId: string): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Không tìm thấy job với ID: ${jobId}`);
    }

    if (
      job.status !== JobStatus.REMOVED_BY_ADMIN &&
      job.status !== JobStatus.REMOVED_BY_EMPLOYER
    ) {
      throw new BadRequestException('Chỉ có thể khôi phục tin đã bị xóa');
    }

    // Restore to HIDDEN status (employer can unhide later)
    job.status = JobStatus.HIDDEN;
    await this.jobRepository.save(job);

    this.logger.log(`Job ${jobId} restored from ${job.status} to HIDDEN`);
  }

  /**
   * Update job status
   * Admin can change job status between ACTIVE, HIDDEN, INACTIVE
   */
  async updateJobStatus(jobId: string, newStatus: JobStatus): Promise<void> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Không tìm thấy job với ID: ${jobId}`);
    }

    // Validate status transitions
    const allowedStatuses = [
      JobStatus.ACTIVE,
      JobStatus.HIDDEN,
      JobStatus.EXPIRED,
      JobStatus.CLOSED,
    ];

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển sang trạng thái ${newStatus}`,
      );
    }

    job.status = newStatus;
    await this.jobRepository.save(job);

    this.logger.log(`Job ${jobId} status updated to ${newStatus}`);
  }
}
