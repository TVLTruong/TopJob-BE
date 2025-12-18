// src/modules/admin-employer-approval/admin-employer-approval.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import {
  User,
  Employer,
  EmployerPendingEdit,
  ApprovalLog,
} from '../../database/entities';
import {
  UserStatus,
  EmployerStatus,
  EmployerProfileStatus,
  ApprovalAction,
  ApprovalTargetType,
} from '../../common/enums';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import {
  QueryEmployerDto,
  EmployerDetailDto,
  EmployerUserDto,
  EmployerProfileDto,
  PendingEditFieldDto,
  ApproveEmployerDto,
  RejectEmployerDto,
} from './dto';

/**
 * Admin Employer Approval Service
 * Handles employer profile approval workflow
 *
 * Use Cases:
 * - UCADM01: Admin duyệt hồ sơ NTD
 * - UCEMP02: Admin duyệt chỉnh sửa hồ sơ NTD
 */
@Injectable()
export class AdminEmployerApprovalService {
  private readonly logger = new Logger(AdminEmployerApprovalService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    @InjectRepository(EmployerPendingEdit)
    private readonly pendingEditRepository: Repository<EmployerPendingEdit>,
    @InjectRepository(ApprovalLog)
    private readonly approvalLogRepository: Repository<ApprovalLog>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get paginated list of employers pending approval
   * Includes both new profiles and pending edits
   */
  async getEmployerList(
    queryDto: QueryEmployerDto,
  ): Promise<PaginationResponseDto<Employer>> {
    const { page = 1, limit = 10, status, profileStatus } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.employerRepository
      .createQueryBuilder('employer')
      .leftJoinAndSelect('employer.user', 'user')
      .leftJoinAndSelect('employer.pendingEdits', 'pendingEdits');

    // Filter: Only employers needing approval
    if (status) {
      queryBuilder.andWhere('employer.status = :status', { status });
    } else {
      // Default: Show both pending approval statuses
      queryBuilder.andWhere('employer.status IN (:...statuses)', {
        statuses: [EmployerStatus.PENDING_APPROVAL, EmployerStatus.ACTIVE],
      });
    }

    if (profileStatus) {
      queryBuilder.andWhere('employer.profileStatus = :profileStatus', {
        profileStatus,
      });
    } else {
      // Also include pending edit approvals
      queryBuilder.andWhere(
        '(employer.status = :pendingStatus OR employer.profileStatus = :pendingEditStatus)',
        {
          pendingStatus: EmployerStatus.PENDING_APPROVAL,
          pendingEditStatus: EmployerProfileStatus.PENDING_EDIT_APPROVAL,
        },
      );
    }

    // Order by creation date (oldest first - FIFO)
    queryBuilder.orderBy('employer.createdAt', 'ASC');

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
   * Get detailed employer information for approval review
   * Includes user, employer profile, and pending edits comparison
   */
  async getEmployerDetail(employerId: string): Promise<EmployerDetailDto> {
    const employer = await this.employerRepository.findOne({
      where: { id: employerId },
      relations: ['user', 'pendingEdits'],
    });

    if (!employer) {
      throw new NotFoundException(
        `Không tìm thấy nhà tuyển dụng với ID: ${employerId}`,
      );
    }

    // Transform pending edits to include field labels
    const pendingEditsDto = employer.pendingEdits?.map((edit) =>
      plainToInstance(
        PendingEditFieldDto,
        {
          ...edit,
          fieldLabel: edit.getFieldLabel(),
        },
        { excludeExtraneousValues: true },
      ),
    );

    const detail: EmployerDetailDto = {
      user: plainToInstance(EmployerUserDto, employer.user, {
        excludeExtraneousValues: true,
      }),
      employer: plainToInstance(EmployerProfileDto, employer, {
        excludeExtraneousValues: true,
      }),
      pendingEdits: pendingEditsDto?.length ? pendingEditsDto : null,
      hasPendingEdits: employer.hasPendingEdits(),
    };

    return detail;
  }

  /**
   * Approve employer profile or pending edits
   * Uses transaction to ensure data consistency
   */
  async approveEmployer(
    employerId: string,
    adminId: string,
    dto: ApproveEmployerDto,
  ): Promise<{ message: string; employer: Employer }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock employer record for update
      const employer = await queryRunner.manager.findOne(Employer, {
        where: { id: employerId },
        relations: ['user', 'pendingEdits'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!employer) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${employerId}`,
        );
      }

      const user = employer.user;
      let approvalTarget: ApprovalTargetType;
      let statusMessage: string;

      // Case 1: New employer profile approval
      if (employer.status === EmployerStatus.PENDING_APPROVAL) {
        // Validate user status
        if (user.status !== UserStatus.PENDING_APPROVAL) {
          throw new BadRequestException(
            `Trạng thái user không hợp lệ. Hiện tại: ${user.status}`,
          );
        }

        // Approve new profile
        employer.status = EmployerStatus.ACTIVE;
        employer.isApproved = true;
        user.status = UserStatus.ACTIVE;

        approvalTarget = ApprovalTargetType.EMPLOYER_PROFILE;
        statusMessage = 'Đã duyệt hồ sơ nhà tuyển dụng mới';

        this.logger.log(
          `Approved new employer profile: ${employerId} by admin: ${adminId}`,
        );
      }
      // Case 2: Pending edits approval
      else if (
        employer.profileStatus === EmployerProfileStatus.PENDING_EDIT_APPROVAL
      ) {
        if (!employer.pendingEdits?.length) {
          throw new BadRequestException(
            'Không có chỉnh sửa nào đang chờ duyệt',
          );
        }

        // Apply pending edits to employer
        for (const edit of employer.pendingEdits) {
          const fieldName = edit.fieldName;
          if (fieldName in employer) {
            employer[fieldName as keyof Employer] = edit.newValue as never;
          }
        }

        // Delete pending edits
        await queryRunner.manager.delete(EmployerPendingEdit, {
          employerId: employer.id,
        });

        // Update profile status
        employer.profileStatus = EmployerProfileStatus.APPROVED;

        approvalTarget = ApprovalTargetType.EMPLOYER_PROFILE_EDIT;
        statusMessage = 'Đã duyệt chỉnh sửa hồ sơ nhà tuyển dụng';

        this.logger.log(
          `Approved employer edits: ${employerId} by admin: ${adminId}`,
        );
      } else {
        throw new BadRequestException(
          'Nhà tuyển dụng không ở trạng thái chờ duyệt',
        );
      }

      // Save employer and user
      await queryRunner.manager.save(Employer, employer);
      await queryRunner.manager.save(User, user);

      // Create approval log
      const approvalLog = queryRunner.manager.create(ApprovalLog, {
        adminId,
        targetType: approvalTarget,
        targetId: employer.id,
        action: ApprovalAction.APPROVED,
        reason: dto.note || null,
      });
      await queryRunner.manager.save(ApprovalLog, approvalLog);

      await queryRunner.commitTransaction();

      return {
        message: statusMessage,
        employer,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to approve employer ${employerId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Reject employer profile or pending edits
   * Must provide reason for rejection
   */
  async rejectEmployer(
    employerId: string,
    adminId: string,
    dto: RejectEmployerDto,
  ): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock employer record for update
      const employer = await queryRunner.manager.findOne(Employer, {
        where: { id: employerId },
        relations: ['user', 'pendingEdits'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!employer) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${employerId}`,
        );
      }

      const user = employer.user;
      let approvalTarget: ApprovalTargetType;
      let statusMessage: string;

      // Case 1: New employer profile rejection
      if (employer.status === EmployerStatus.PENDING_APPROVAL) {
        // Validate user status
        if (user.status !== UserStatus.PENDING_APPROVAL) {
          throw new BadRequestException(
            `Trạng thái user không hợp lệ. Hiện tại: ${user.status}`,
          );
        }

        // Reject new profile - user must complete profile again
        user.status = UserStatus.PENDING_PROFILE_COMPLETION;

        approvalTarget = ApprovalTargetType.EMPLOYER_PROFILE;
        statusMessage = 'Đã từ chối hồ sơ nhà tuyển dụng';

        this.logger.log(
          `Rejected new employer profile: ${employerId} by admin: ${adminId}`,
        );
      }
      // Case 2: Pending edits rejection
      else if (
        employer.profileStatus === EmployerProfileStatus.PENDING_EDIT_APPROVAL
      ) {
        if (!employer.pendingEdits?.length) {
          throw new BadRequestException(
            'Không có chỉnh sửa nào đang chờ duyệt',
          );
        }

        // Delete pending edits (keep old profile)
        await queryRunner.manager.delete(EmployerPendingEdit, {
          employerId: employer.id,
        });

        // Update profile status back to approved
        employer.profileStatus = EmployerProfileStatus.APPROVED;

        approvalTarget = ApprovalTargetType.EMPLOYER_PROFILE_EDIT;
        statusMessage = 'Đã từ chối chỉnh sửa hồ sơ nhà tuyển dụng';

        this.logger.log(
          `Rejected employer edits: ${employerId} by admin: ${adminId}`,
        );
      } else {
        throw new BadRequestException(
          'Nhà tuyển dụng không ở trạng thái chờ duyệt',
        );
      }

      // Save employer and user
      await queryRunner.manager.save(Employer, employer);
      await queryRunner.manager.save(User, user);

      // Create approval log
      const approvalLog = queryRunner.manager.create(ApprovalLog, {
        adminId,
        targetType: approvalTarget,
        targetId: employer.id,
        action: ApprovalAction.REJECTED,
        reason: dto.reason,
      });
      await queryRunner.manager.save(ApprovalLog, approvalLog);

      await queryRunner.commitTransaction();

      // TODO: Send rejection email to employer
      // await this.mailService.sendEmployerRejectionEmail(user.email, dto.reason);

      return {
        message: statusMessage,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to reject employer ${employerId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
