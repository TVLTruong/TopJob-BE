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
  EmployerApprovalType,
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
import { EmployerEmailService } from '../auth/services/employer-email.service';

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
    private readonly employerEmailService: EmployerEmailService,
  ) {}

  /**
   * Get paginated list of employers pending approval
   * Includes both new profiles and pending edits
   */
  async getEmployerList(
    queryDto: QueryEmployerDto,
  ): Promise<PaginationResponseDto<Employer>> {
    const {
      page = 1,
      limit = 10,
      approvalType = EmployerApprovalType.ALL,
    } = queryDto;

    const skip = (page - 1) * limit;

    const qb = this.employerRepository
      .createQueryBuilder('employer')
      .leftJoinAndSelect('employer.user', 'user')
      .leftJoinAndSelect('employer.pendingEdits', 'pendingEdits');

    /**
     * CASE 1 – New approval
     * employer.status = PENDING_APPROVAL
     * user.status = PENDING_APPROVAL
     * profileStatus = PENDING_NEW_APPROVAL
     */
    if (approvalType === EmployerApprovalType.NEW) {
      qb.where(
        `
      employer.status = :employerPending
      AND user.status = :userPending
      AND employer.profileStatus = :profileNew
      `,
        {
          employerPending: EmployerStatus.PENDING_APPROVAL,
          userPending: UserStatus.PENDING_APPROVAL,
          profileNew: EmployerProfileStatus.PENDING_NEW_APPROVAL,
        },
      );
    }

    /**
     * CASE 2 – Edit approval
     * employer.status = ACTIVE (vẫn active, chỉ có pending edits)
     * user.status = ACTIVE
     * profileStatus = PENDING_EDIT_APPROVAL
     */
    if (approvalType === EmployerApprovalType.EDIT) {
      qb.where(
        `
      employer.status = :employerActive
      AND user.status = :userActive
      AND employer.profileStatus = :profileEdit
      `,
        {
          employerActive: EmployerStatus.ACTIVE,
          userActive: UserStatus.ACTIVE,
          profileEdit: EmployerProfileStatus.PENDING_EDIT_APPROVAL,
        },
      );
    }

    /**
     * CASE 3 – ALL (both new and edit)
     */
    if (approvalType === EmployerApprovalType.ALL) {
      qb.where(
        `
      (
        (
          employer.status = :employerPending
          AND user.status = :userPending
          AND employer.profileStatus = :profileNew
        )
        OR
        (
          employer.status = :employerActive
          AND user.status = :userActive
          AND employer.profileStatus = :profileEdit
        )
      )
      `,
        {
          employerPending: EmployerStatus.PENDING_APPROVAL,
          userPending: UserStatus.PENDING_APPROVAL,
          profileNew: EmployerProfileStatus.PENDING_NEW_APPROVAL,
          employerActive: EmployerStatus.ACTIVE,
          userActive: UserStatus.ACTIVE,
          profileEdit: EmployerProfileStatus.PENDING_EDIT_APPROVAL,
        },
      );
    }

    qb.orderBy('employer.createdAt', 'ASC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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
      relations: ['user', 'pendingEdits', 'locations'],
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
      pendingEdits: pendingEditsDto?.length ? pendingEditsDto : [],
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
      // Lock employer record for update (without relations to avoid outer join issue)
      const employer = await queryRunner.manager.findOne(Employer, {
        where: { id: employerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!employer) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${employerId}`,
        );
      }

      // Load relations separately after locking
      const employerWithRelations = await queryRunner.manager.findOne(
        Employer,
        {
          where: { id: employerId },
          relations: ['user', 'pendingEdits'],
        },
      );

      // Use the locked employer but with relations data
      Object.assign(employer, employerWithRelations);
      const user = employer.user;
      let approvalTarget: ApprovalTargetType;
      let statusMessage: string;

      // Debug logging
      this.logger.debug(
        `Employer status: ${employer.status}, profileStatus: ${employer.profileStatus}`,
      );
      this.logger.debug(
        `Pending edits count: ${employer.pendingEdits?.length || 0}`,
      );
      this.logger.debug(`User status: ${user?.status || 'NO USER'}`);

      // Case 1: New employer profile approval
      if (employer.status === EmployerStatus.PENDING_APPROVAL) {
        // Validate user status
        if (user.status !== UserStatus.PENDING_APPROVAL) {
          this.logger.error(
            `User status validation failed. Expected: ${UserStatus.PENDING_APPROVAL}, Got: ${user.status}`,
          );
          throw new BadRequestException(
            `Trạng thái user không hợp lệ. Hiện tại: ${user.status}, yêu cầu: ${UserStatus.PENDING_APPROVAL}`,
          );
        }

        // Approve new profile
        employer.status = EmployerStatus.ACTIVE;
        employer.isApproved = true;
        employer.profileStatus = EmployerProfileStatus.APPROVED;
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
        // Handle edge case: profileStatus is PENDING_EDIT_APPROVAL but no pending edits
        if (!employer.pendingEdits?.length) {
          this.logger.warn(
            `Employer ${employerId} has profileStatus PENDING_EDIT_APPROVAL but no pending edits. Resetting to APPROVED.`,
          );

          // Reset profile status to APPROVED
          employer.profileStatus = EmployerProfileStatus.APPROVED;

          approvalTarget = ApprovalTargetType.EMPLOYER_PROFILE_EDIT;
          statusMessage =
            'Đã cập nhật trạng thái hồ sơ (không có thay đổi nào chờ duyệt)';

          this.logger.log(
            `Reset employer profileStatus to APPROVED: ${employerId} by admin: ${adminId}`,
          );
        } else {
          // Apply pending edits to employer
          for (const edit of employer.pendingEdits) {
            const fieldName = edit.fieldName;
            const newValue = edit.newValue;

            if (!newValue) {
              this.logger.warn(
                `Pending edit for field ${fieldName} has no new value. Skipping.`,
              );
              continue;
            }

            // Parse JSON fields
            if (
              fieldName === 'employerCategory' ||
              fieldName === 'technologies' ||
              fieldName === 'benefits'
            ) {
              try {
                // employer[fieldName] = JSON.parse(newValue);
                const parsedValue = JSON.parse(newValue) as string[];
                employer[fieldName] = parsedValue;
              } catch (error) {
                this.logger.error(
                  `Failed to parse ${fieldName}: ${(error as Error).message}`,
                );
                throw new BadRequestException(
                  `Không thể parse dữ liệu ${fieldName}`,
                );
              }
            } else if (fieldName === 'locations') {
              // Skip locations - will be handled separately
              continue;
            } else if (fieldName in employer) {
              // Simple string fields
              employer[fieldName as keyof Employer] = newValue as never;
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
        }
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
        reason: dto.note ?? undefined,
      });
      await queryRunner.manager.save(ApprovalLog, approvalLog);

      await queryRunner.commitTransaction();

      // Send email notification after successful approval
      const isNewProfile =
        approvalTarget === ApprovalTargetType.EMPLOYER_PROFILE;
      try {
        await this.employerEmailService.sendEmployerApprovalEmail(
          user.email,
          employer.companyName,
          isNewProfile,
        );
        this.logger.log(`Approval email sent to ${user.email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send approval email: ${(emailError as Error).message}`,
        );
        // Don't fail the whole operation if email fails
      }

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
      // Lock employer record for update (without relations to avoid outer join issue)
      const employer = await queryRunner.manager.findOne(Employer, {
        where: { id: employerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!employer) {
        throw new NotFoundException(
          `Không tìm thấy nhà tuyển dụng với ID: ${employerId}`,
        );
      }

      // Load relations separately after locking
      const employerWithRelations = await queryRunner.manager.findOne(
        Employer,
        {
          where: { id: employerId },
          relations: ['user', 'pendingEdits'],
        },
      );

      // Use the locked employer but with relations data
      Object.assign(employer, employerWithRelations);
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

      // Send rejection email notification
      const isNewProfile =
        approvalTarget === ApprovalTargetType.EMPLOYER_PROFILE;
      try {
        await this.employerEmailService.sendEmployerRejectionEmail(
          user.email,
          employer.companyName,
          dto.reason,
          isNewProfile,
        );
        this.logger.log(`Rejection email sent to ${user.email}`);
      } catch (emailError) {
        this.logger.error(
          `Failed to send rejection email: ${(emailError as Error).message}`,
        );
        // Don't fail the whole operation if email fails
      }

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
