// src/modules/admin-employer-management/admin-employer-management.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User, Employer, Job } from '../../database/entities';
import { UserRole, UserStatus, JobStatus } from '../../common/enums';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import {
  QueryEmployerDto,
  EmployerDetailResponseDto,
  EmployerUserInfoDto,
  EmployerProfileInfoDto,
  EmployerJobStatsDto,
  EmployerLocationDto,
  BanEmployerDto,
} from './dto';

/**
 * Admin Employer Management Service
 * Domain-driven service for managing employer accounts
 *
 * Use Cases:
 * - UCADM03: Admin quản lý nhà tuyển dụng
 */
@Injectable()
export class AdminEmployerManagementService {
  private readonly logger = new Logger(AdminEmployerManagementService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated list of employers
   * Supports search by email/company name and filter by status
   */
  async getEmployerList(
    queryDto: QueryEmployerDto,
  ): Promise<PaginationResponseDto<User>> {
    const { page = 1, limit = 10, search, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.employer', 'employer')
      .where('user.role = :role', { role: UserRole.EMPLOYER });

    // Search by email or company name
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR employer.companyName ILIKE :search OR employer.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('user.createdAt', 'DESC');

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
   * Get detailed employer information
   * Includes user info, profile, and job statistics
   */
  async getEmployerDetail(userId: string): Promise<EmployerDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.EMPLOYER },
      relations: [
        'employer',
        'employer.locations',
        'employer.employerCategories',
        'employer.employerCategories.category',
      ],
    });

    if (!user) {
      throw new NotFoundException(
        `Không tìm thấy nhà tuyển dụng với ID: ${userId}`,
      );
    }

    if (!user.employer) {
      throw new NotFoundException('Nhà tuyển dụng chưa hoàn thiện hồ sơ');
    }

    // Get job statistics
    const jobStats = await this.getEmployerJobStats(user.employer.id);

    // Transform to DTOs
    const userInfo = plainToInstance(EmployerUserInfoDto, user, {
      excludeExtraneousValues: true,
    });

    const profileInfo = plainToInstance(EmployerProfileInfoDto, user.employer, {
      excludeExtraneousValues: true,
    });

    // Add locations
    const locations =
      user.employer.locations?.map((loc) =>
        plainToInstance(EmployerLocationDto, loc, {
          excludeExtraneousValues: true,
        }),
      ) || [];

    // Add categories/industries
    const industries =
      user.employer.employerCategories?.map((ec) => ({
        id: ec.category.id,
        name: ec.category.name,
        slug: ec.category.slug,
        isPrimary: ec.isPrimary,
      })) || [];

    return {
      user: userInfo,
      profile: profileInfo,
      jobStats,
      locations,
      industries,
    };
  }

  /**
   * Get job statistics for employer
   */
  private async getEmployerJobStats(
    employerId: string,
  ): Promise<EmployerJobStatsDto> {
    const [totalJobs, activeJobs, pendingJobs, rejectedJobs] =
      await Promise.all([
        this.jobRepository.count({ where: { employerId } }),
        this.jobRepository.count({
          where: { employerId, status: JobStatus.ACTIVE },
        }),
        this.jobRepository.count({
          where: { employerId, status: JobStatus.PENDING_APPROVAL },
        }),
        this.jobRepository.count({
          where: { employerId, status: JobStatus.REJECTED },
        }),
      ]);

    return {
      totalJobs,
      activeJobs,
      pendingJobs,
      rejectedJobs,
    };
  }

  /**
   * Ban employer account
   * - Sets user.status = BANNED
   * - Hides all employer's job posts
   * - Cannot ban self
   */
  async banEmployer(
    userId: string,
    adminId: string,
    dto: BanEmployerDto,
  ): Promise<{ message: string }> {
    // Prevent admin from banning themselves
    if (userId === adminId) {
      throw new ForbiddenException('Không thể tự cấm tài khoản của chính mình');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user record for update
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId, role: UserRole.EMPLOYER },
        relations: ['employer'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${userId}`,
        );
      }

      // Validate current status
      if (user.status === UserStatus.BANNED) {
        throw new BadRequestException('Tài khoản đã bị cấm trước đó');
      }

      // Update user status
      user.status = UserStatus.BANNED;
      await queryRunner.manager.save(User, user);

      // Hide all active jobs from this employer
      if (user.employer) {
        await queryRunner.manager.update(
          Job,
          {
            employerId: user.employer.id,
            status: JobStatus.ACTIVE,
          },
          {
            status: JobStatus.HIDDEN,
          },
        );
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Banned employer ${userId} by admin ${adminId}. Reason: ${dto.reason}`,
      );

      // TODO: Send notification email to employer
      // await this.mailService.sendBanNotificationEmail(user.email, dto.reason);

      return {
        message: 'Đã cấm tài khoản nhà tuyển dụng thành công',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to ban employer ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unban employer account
   * - Sets user.status = ACTIVE
   * - Only allowed if user is not deleted
   */
  async unbanEmployer(
    userId: string,
    adminId: string,
  ): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user record for update
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId, role: UserRole.EMPLOYER },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${userId}`,
        );
      }

      // Validate current status
      if (user.status !== UserStatus.BANNED) {
        throw new BadRequestException(
          `Không thể mở cấm. Trạng thái hiện tại: ${user.status}. Chỉ có thể mở cấm tài khoản có trạng thái BANNED.`,
        );
      }

      // Update user status
      user.status = UserStatus.ACTIVE;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      this.logger.log(`Unbanned employer ${userId} by admin ${adminId}`);

      // TODO: Send notification email to employer
      // await this.mailService.sendUnbanNotificationEmail(user.email);

      return {
        message: 'Đã mở cấm tài khoản nhà tuyển dụng thành công',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to unban employer ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete employer account permanently
   * - Deletes user record
   * - Cascades to all related data (employer profile, jobs, applications, etc.)
   * - Cannot delete self
   */
  async deleteEmployer(
    userId: string,
    adminId: string,
  ): Promise<{ message: string }> {
    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw new ForbiddenException('Không thể tự xóa tài khoản của chính mình');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user record for delete
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId, role: UserRole.EMPLOYER },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${userId}`,
        );
      }

      // Delete user (cascade will handle related data)
      await queryRunner.manager.remove(User, user);

      await queryRunner.commitTransaction();

      this.logger.warn(
        `Deleted employer ${userId} (${user.email}) by admin ${adminId}`,
      );

      return {
        message: 'Đã xóa tài khoản nhà tuyển dụng và toàn bộ dữ liệu liên quan',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete employer ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
