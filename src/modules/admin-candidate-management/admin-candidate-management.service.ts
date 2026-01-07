// src/modules/admin-candidate-management/admin-candidate-management.service.ts

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
import { User, Candidate, Application } from '../../database/entities';
import { UserRole, UserStatus, ApplicationStatus } from '../../common/enums';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import {
  QueryCandidateDto,
  CandidateDetailResponseDto,
  CandidateUserInfoDto,
  CandidateProfileInfoDto,
  CandidateApplicationStatsDto,
  CandidateCvDto,
  BanCandidateDto,
  UpdateCandidateDto,
} from './dto';

/**
 * Admin Candidate Management Service
 * Domain-driven service for managing candidate accounts
 *
 * Use Cases:
 * - UCADM04: Admin quản lý ứng viên
 */
@Injectable()
export class AdminCandidateManagementService {
  private readonly logger = new Logger(AdminCandidateManagementService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated list of candidates
   * Supports search by email/name and filter by status
   */
  async getCandidateList(
    queryDto: QueryCandidateDto,
  ): Promise<PaginationResponseDto<User>> {
    const { page = 1, limit = 10, search, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.candidate', 'candidate')
      .where('user.role = :role', { role: UserRole.CANDIDATE });

    // Search by email or full name
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR candidate.fullName ILIKE :search)',
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
   * Get detailed candidate information
   * Includes user info, profile, and application statistics
   */
  async getCandidateDetail(
    userId: string,
  ): Promise<CandidateDetailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.CANDIDATE },
      relations: ['candidate', 'candidate.cvs'],
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy ứng viên với ID: ${userId}`);
    }

    if (!user.candidate) {
      throw new NotFoundException('Ứng viên chưa hoàn thiện hồ sơ');
    }

    // Get application statistics
    const applicationStats = await this.getCandidateApplicationStats(
      user.candidate.id,
    );

    // Transform to DTOs
    const userInfo = plainToInstance(CandidateUserInfoDto, user, {
      excludeExtraneousValues: true,
    });

    const profileInfo = plainToInstance(
      CandidateProfileInfoDto,
      user.candidate,
      {
        excludeExtraneousValues: true,
      },
    );

    const cvs =
      user.candidate.cvs?.map((cv) =>
        plainToInstance(CandidateCvDto, cv, {
          excludeExtraneousValues: true,
        }),
      ) || [];

    return {
      user: userInfo,
      profile: profileInfo,
      applicationStats,
      cvs,
    };
  }

  /**
   * Get application statistics for candidate
   */
  private async getCandidateApplicationStats(
    candidateId: string,
  ): Promise<CandidateApplicationStatsDto> {
    const [
      totalApplications,
      newApplications,
      viewedApplications,
      shortlistedApplications,
      hiredApplications,
      rejectedApplications,
    ] = await Promise.all([
      this.applicationRepository.count({ where: { candidateId } }),
      this.applicationRepository.count({
        where: { candidateId, status: ApplicationStatus.NEW },
      }),
      this.applicationRepository.count({
        where: { candidateId, status: ApplicationStatus.VIEWED },
      }),
      this.applicationRepository.count({
        where: { candidateId, status: ApplicationStatus.SHORTLISTED },
      }),
      this.applicationRepository.count({
        where: { candidateId, status: ApplicationStatus.HIRED },
      }),
      this.applicationRepository.count({
        where: { candidateId, status: ApplicationStatus.REJECTED },
      }),
    ]);

    return {
      totalApplications,
      newApplications,
      viewedApplications,
      shortlistedApplications,
      hiredApplications,
      rejectedApplications,
    };
  }

  /**
   * Ban candidate account
   * - Sets user.status = BANNED
   * - Cannot ban self
   */
  async banCandidate(
    userId: string,
    adminId: string,
    dto: BanCandidateDto,
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
        where: { id: userId, role: UserRole.CANDIDATE },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy ứng viên với ID: ${userId}`,
        );
      }

      // Validate current status
      if (user.status === UserStatus.BANNED) {
        throw new BadRequestException('Tài khoản đã bị cấm trước đó');
      }

      // Update user status
      user.status = UserStatus.BANNED;
      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Banned candidate ${userId} by admin ${adminId}. Reason: ${dto.reason}`,
      );

      // TODO: Send notification email to candidate
      // await this.mailService.sendBanNotificationEmail(user.email, dto.reason);

      return {
        message: 'Đã cấm tài khoản ứng viên thành công',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to ban candidate ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Unban candidate account
   * - Sets user.status = ACTIVE
   */
  async unbanCandidate(
    userId: string,
    adminId: string,
  ): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user record for update
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId, role: UserRole.CANDIDATE },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy ứng viên với ID: ${userId}`,
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

      this.logger.log(`Unbanned candidate ${userId} by admin ${adminId}`);

      // TODO: Send notification email to candidate
      // await this.mailService.sendUnbanNotificationEmail(user.email);

      return {
        message: 'Đã mở cấm tài khoản ứng viên thành công',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to unban candidate ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update candidate basic information
   * Only allows updating non-system fields: fullName, phoneNumber, avatarUrl
   */
  async updateCandidate(
    userId: string,
    dto: UpdateCandidateDto,
  ): Promise<{ message: string; candidate: Candidate }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user and candidate records
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId, role: UserRole.CANDIDATE },
        relations: ['candidate'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy ứng viên với ID: ${userId}`,
        );
      }

      if (!user.candidate) {
        throw new NotFoundException('Ứng viên chưa hoàn thiện hồ sơ');
      }

      const candidate = user.candidate;

      // Update allowed fields
      if (dto.fullName !== undefined) {
        candidate.fullName = dto.fullName;
      }

      if (dto.phoneNumber !== undefined) {
        candidate.phoneNumber = dto.phoneNumber;
      }

      if (dto.avatarUrl !== undefined) {
        candidate.avatarUrl = dto.avatarUrl;
      }

      await queryRunner.manager.save(Candidate, candidate);

      await queryRunner.commitTransaction();

      this.logger.log(`Updated candidate ${userId} profile by admin`);

      return {
        message: 'Đã cập nhật thông tin ứng viên thành công',
        candidate,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to update candidate ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete candidate account (soft delete option)
   * Check if candidate has applications before deletion
   */
  async deleteCandidate(
    userId: string,
    adminId: string,
    force = false,
  ): Promise<{ message: string }> {
    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw new ForbiddenException('Không thể tự xóa tài khoản của chính mình');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock user record
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId, role: UserRole.CANDIDATE },
        relations: ['candidate'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(
          `Không tìm thấy ứng viên với ID: ${userId}`,
        );
      }

      // Check for existing applications
      if (user.candidate) {
        const applicationCount = await queryRunner.manager.count(Application, {
          where: { candidateId: user.candidate.id },
        });

        if (applicationCount > 0 && !force) {
          throw new BadRequestException(
            `Không thể xóa ứng viên có ${applicationCount} hồ sơ ứng tuyển. Sử dụng soft delete hoặc force delete.`,
          );
        }
      }

      // Delete user (cascade will handle related data)
      await queryRunner.manager.remove(User, user);

      await queryRunner.commitTransaction();

      this.logger.warn(
        `Deleted candidate ${userId} (${user.email}) by admin ${adminId}`,
      );

      return {
        message: 'Đã xóa tài khoản ứng viên và toàn bộ dữ liệu liên quan',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete candidate ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
