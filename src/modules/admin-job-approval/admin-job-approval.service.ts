// src/modules/admin-job-approval/admin-job-approval.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Job, ApprovalLog } from '../../database/entities';
import {
  JobStatus,
  ApprovalAction,
  ApprovalTargetType,
} from '../../common/enums';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { QueryJobDto, JobDetailDto, ApproveJobDto, RejectJobDto } from './dto';

/**
 * Admin Job Approval Service
 * Handles job post approval workflow
 *
 * Use Cases:
 * - UCADM02: Admin duyệt tin tuyển dụng
 */
@Injectable()
export class AdminJobApprovalService {
  private readonly logger = new Logger(AdminJobApprovalService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(ApprovalLog)
    private readonly approvalLogRepository: Repository<ApprovalLog>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated list of jobs pending approval
   */
  async getJobList(queryDto: QueryJobDto): Promise<PaginationResponseDto<Job>> {
    const { page = 1, limit = 10, search, categoryId, employerId } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.employer', 'employer')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.location', 'location');

    // Only show jobs pending approval
    queryBuilder.andWhere('job.status = :status', {
      status: JobStatus.PENDING_APPROVAL,
    });

    // Search by job title
    if (search) {
      queryBuilder.andWhere('job.title ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Filter by category
    if (categoryId) {
      queryBuilder.andWhere('job.categoryId = :categoryId', { categoryId });
    }

    // Filter by employer
    if (employerId) {
      queryBuilder.andWhere('job.employerId = :employerId', { employerId });
    }

    // Order by creation date (oldest first - FIFO)
    queryBuilder.orderBy('job.createdAt', 'ASC');

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed job information for approval review
   */
  async getJobDetail(jobId: string): Promise<JobDetailDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: ['employer', 'category', 'location'],
    });

    if (!job) {
      throw new NotFoundException(
        `Không tìm thấy tin tuyển dụng với ID: ${jobId}`,
      );
    }

    return plainToInstance(JobDetailDto, job, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Approve a job post
   * Changes status to ACTIVE and sets publishedAt timestamp
   */
  async approveJob(
    jobId: string,
    adminId: string,
    dto: ApproveJobDto,
  ): Promise<{ message: string; job: Job }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock job record for update
      const job = await queryRunner.manager.findOne(Job, {
        where: { id: jobId },
        relations: ['employer'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!job) {
        throw new NotFoundException(
          `Không tìm thấy tin tuyển dụng với ID: ${jobId}`,
        );
      }

      // Validate current status
      if (job.status !== JobStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          `Không thể duyệt tin tuyển dụng. Trạng thái hiện tại: ${job.status}. Chỉ có thể duyệt tin có trạng thái PENDING_APPROVAL.`,
        );
      }

      // Update job status
      job.status = JobStatus.ACTIVE;
      job.publishedAt = new Date();

      await queryRunner.manager.save(Job, job);

      // Create approval log
      const approvalLog = queryRunner.manager.create(ApprovalLog, {
        adminId,
        targetType: ApprovalTargetType.JOB_POST,
        targetId: job.id,
        action: ApprovalAction.APPROVED,
        reason: dto.note || null,
      });
      await queryRunner.manager.save(ApprovalLog, approvalLog);

      await queryRunner.commitTransaction();

      this.logger.log(`Approved job post: ${jobId} by admin: ${adminId}`);

      return {
        message: 'Đã duyệt tin tuyển dụng thành công',
        job,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to approve job ${jobId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject a job post
   * Changes status to REJECTED and logs rejection reason
   * TODO: Send email notification to employer
   */
  async rejectJob(
    jobId: string,
    adminId: string,
    dto: RejectJobDto,
  ): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock job record for update
      const job = await queryRunner.manager.findOne(Job, {
        where: { id: jobId },
        relations: ['employer', 'employer.user'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!job) {
        throw new NotFoundException(
          `Không tìm thấy tin tuyển dụng với ID: ${jobId}`,
        );
      }

      // Validate current status
      if (job.status !== JobStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          `Không thể từ chối tin tuyển dụng. Trạng thái hiện tại: ${job.status}. Chỉ có thể từ chối tin có trạng thái PENDING_APPROVAL.`,
        );
      }

      // Update job status
      job.status = JobStatus.REJECTED;

      await queryRunner.manager.save(Job, job);

      // Create approval log with rejection reason
      const approvalLog = queryRunner.manager.create(ApprovalLog, {
        adminId,
        targetType: ApprovalTargetType.JOB_POST,
        targetId: job.id,
        action: ApprovalAction.REJECTED,
        reason: dto.reason,
      });
      await queryRunner.manager.save(ApprovalLog, approvalLog);

      await queryRunner.commitTransaction();

      this.logger.log(`Rejected job post: ${jobId} by admin: ${adminId}`);

      // TODO: Send rejection email to employer
      // const employerEmail = job.employer?.user?.email;
      // if (employerEmail) {
      //   await this.mailService.sendJobRejectionEmail(
      //     employerEmail,
      //     job.title,
      //     dto.reason,
      //   );
      // }

      return {
        message: 'Đã từ chối tin tuyển dụng',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to reject job ${jobId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
