// src/modules/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Candidate, Employer } from '../../database/entities';
import {
  UserRole,
  UserStatus,
  EmployerStatus,
  OtpPurpose,
} from '../../common/enums';
import { UserResponseDto, UpdatePasswordDto, UpdateUserInfoDto, UpdateEmailDto, DeleteAccountDto } from './dto';
import { OtpService } from '../auth/services/otp.service';
import { EmailService } from '../auth/services/email.service';
import { StorageService } from '../storage/storage.service';

/**
 * Users Service
 * Handles user management
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get current user info (GET /users/me)
   */
  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    console.log('[GET_CURRENT_USER] Looking up user with ID:', userId);
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['candidate', 'employer'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    console.log('[GET_CURRENT_USER] Found user:', { id: user.id, email: user.email, role: user.role });
    return this.mapToUserResponse(user);
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['candidate', 'employer'],
    });
  }

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Update password
   */
  async updatePassword(
    userId: string,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Update user status (for admin or internal use)
   */
  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['candidate', 'employer'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.status = status;
    await this.userRepository.save(user);

    return this.mapToUserResponse(user);
  }

  /**
   * Get user profile completion status
   */
  async getProfileCompletionStatus(userId: string): Promise<{
    isComplete: boolean;
    missingFields: string[];
    nextStep: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'candidate',
        'candidate.cvs',
        'employer',
        'employer.locations',
      ],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const missingFields: string[] = [];
    let nextStep = '';

    if (user.role === UserRole.CANDIDATE && user.candidate) {
      const candidate = user.candidate;

      if (!candidate.phoneNumber) missingFields.push('phoneNumber');
      if (!candidate.addressCity) missingFields.push('addressCity');
      if (!candidate.experienceLevel) missingFields.push('experienceLevel');
      if (!candidate.cvs || candidate.cvs.length === 0)
        missingFields.push('cv');

      if (missingFields.length > 0) {
        nextStep = 'Hoàn thiện thông tin cá nhân và tải lên CV';
      }
    } else if (user.role === UserRole.EMPLOYER && user.employer) {
      const employer = user.employer;

      if (!employer.description) missingFields.push('description');
      if (!employer.logoUrl) missingFields.push('logoUrl');
      if (!employer.locations || employer.locations.length === 0)
        missingFields.push('location');
      if (!employer.contactPhone) missingFields.push('contactPhone');

      if (missingFields.length > 0) {
        nextStep = 'Hoàn thiện thông tin công ty và thêm địa điểm văn phòng';
      } else if (employer.status === EmployerStatus.PENDING_APPROVAL) {
        nextStep = 'Chờ admin duyệt hồ sơ';
      }
    }

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      nextStep,
    };
  }

  /**
   * Update last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Verify email (mark user as verified)
   */
  async verifyEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.isVerified = true;
    user.emailVerifiedAt = new Date();

    // Update status based on role
    if (user.role === UserRole.CANDIDATE) {
      user.status = UserStatus.ACTIVE;
    } else if (user.role === UserRole.EMPLOYER) {
      user.status = UserStatus.PENDING_PROFILE_COMPLETION;
    }

    await this.userRepository.save(user);
  }

  /**
   * Map User entity to response DTO
   */
  private mapToUserResponse(user: User): UserResponseDto {
    const response: UserResponseDto = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Add profile info based on role
    if (user.role === UserRole.CANDIDATE && user.candidate) {
      response.profileId = user.candidate.id;
      response.fullName = user.candidate.fullName;
      response.hasCompleteProfile = !!(
        user.candidate.phoneNumber && user.candidate.addressCity
      );
    } else if (user.role === UserRole.EMPLOYER && user.employer) {
      response.profileId = user.employer.id;
      response.fullName = user.employer.fullName;
      response.hasCompleteProfile = user.employer.hasCompleteProfile();
    }

    return response;
  }

  /**
   * Request OTP for updating account information
   */
  async requestUpdateInfoOtp(
    userId: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Generate and save OTP
    const { otpCode } = await this.otpService.createOtp(
      user.email,
      OtpPurpose.ACCOUNT_UPDATE,
    );

    // Send OTP email
    await this.emailService.sendOtpEmail(
      user.email,
      otpCode,
      OtpPurpose.ACCOUNT_UPDATE,
      5,
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
      expiresAt,
    };
  }

  /**
   * Update user account information with OTP verification (for employers)
   */
  async updateUserInfo(
    userId: string,
    dto: UpdateUserInfoDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['employer'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Only employers can update this info
    if (user.role !== UserRole.EMPLOYER || !user.employer) {
      throw new BadRequestException(
        'Chỉ nhà tuyển dụng mới có thể cập nhật thông tin này',
      );
    }

    // Verify OTP
    await this.otpService.verifyOtp(
      user.email,
      dto.otpCode,
      OtpPurpose.ACCOUNT_UPDATE,
    );

    // Update employer profile
    const employer = user.employer;
    if (dto.fullName !== undefined) employer.fullName = dto.fullName;
    if (dto.workTitle !== undefined) employer.workTitle = dto.workTitle;
    if (dto.contactEmail !== undefined)
      employer.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined)
      employer.contactPhone = dto.contactPhone;

    await this.employerRepository.save(employer);

    return { message: 'Cập nhật thông tin tài khoản thành công' };
  }

  /**
   * Request OTP for changing password
   */
  async requestPasswordChangeOtp(
    userId: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Generate and save OTP
    const { otpCode } = await this.otpService.createOtp(
      user.email,
      OtpPurpose.PASSWORD_CHANGE,
    );

    // Send OTP email
    await this.emailService.sendOtpEmail(
      user.email,
      otpCode,
      OtpPurpose.PASSWORD_CHANGE,
      5,
    );

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
      expiresAt,
    };
  }

  /**
   * Update password with OTP verification
   */
  async updatePasswordWithOtp(
    userId: string,
    currentPassword: string,
    newPassword: string,
    otpCode: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    // Verify OTP
    await this.otpService.verifyOtp(
      user.email,
      otpCode,
      OtpPurpose.PASSWORD_CHANGE,
    );

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    return { message: 'Đổi mật khẩu thành công' };
  }

  /**
   * Request OTP for email change
   */
  async requestEmailChangeOtp(
    userId: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    console.log('[REQUEST_EMAIL_CHANGE_OTP] Received userId:', userId);
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    console.log('[REQUEST_EMAIL_CHANGE_OTP] Found user:', { id: user.id, email: user.email, role: user.role });

    try {
      // Generate and save OTP using EMAIL_CHANGE purpose
      const { otpCode, expiresAt, expiresInMinutes } =
        await this.otpService.createOtp(user.email, OtpPurpose.EMAIL_CHANGE);

      console.log(`[EMAIL_CHANGE_OTP] Generated OTP for ${user.email}, code: ${otpCode}, expires in: ${expiresInMinutes}m`);

      // Send OTP email using email service
      await this.emailService.sendOtpEmail(
        user.email,
        otpCode,
        OtpPurpose.EMAIL_CHANGE,
        expiresInMinutes,
      );

      console.log(`[EMAIL_CHANGE_OTP] Email sent successfully to ${user.email}`);

      return {
        message: `Mã OTP đã được gửi đến email: ${user.email}`,
        expiresAt,
      };
    } catch (error) {
      console.error('[EMAIL_CHANGE_OTP] Error:', error);
      throw error;
    }
  }

  /**
   * Update email with OTP verification
   */
  async updateEmail(
    userId: string,
    dto: UpdateEmailDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Check if new email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.newEmail.toLowerCase() },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException('Email này đã được sử dụng');
    }

    // Verify OTP using EMAIL_CHANGE purpose
    await this.otpService.verifyOtp(
      user.email,
      dto.otpCode,
      OtpPurpose.EMAIL_CHANGE,
    );

    // Update email and auto-verify (since user already verified old email)
    user.email = dto.newEmail.toLowerCase();
    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.status = UserStatus.ACTIVE;

    await this.userRepository.save(user);

    return {
      message: 'Email đã được cập nhật thành công',
    };
  }

  /**
   * Request OTP for account deletion
   */
  async requestAccountDeletionOtp(
    userId: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Generate and save OTP using ACCOUNT_UPDATE purpose
    const { otpCode, expiresAt, expiresInMinutes } =
      await this.otpService.createOtp(user.email, OtpPurpose.ACCOUNT_UPDATE);

    // Send OTP email
    await this.emailService.sendOtpEmail(
      user.email,
      otpCode,
      OtpPurpose.ACCOUNT_UPDATE,
      expiresInMinutes,
    );

    return {
      message: 'Mã OTP đã được gửi đến email của bạn',
      expiresAt,
    };
  }

  /**
   * Delete account with OTP verification
   * Hard delete - removes user, candidate profile, and all CVs from storage
   */
  async deleteAccount(
    userId: string,
    dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['candidate', 'candidate.cvs'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Verify OTP using ACCOUNT_UPDATE purpose
    await this.otpService.verifyOtp(
      user.email,
      dto.otpCode,
      OtpPurpose.ACCOUNT_UPDATE,
    );

    // Log deletion reason if provided
    if (dto.reason) {
      this.logger.log(`User ${user.email} deleted account. Reason: ${dto.reason}`);
    }

    // Delete CV files from storage if user is a candidate
    if (user.role === UserRole.CANDIDATE && user.candidate && user.candidate.cvs) {
      for (const cv of user.candidate.cvs) {
        try {
          await this.storageService.deleteFile(cv.fileUrl);
          this.logger.log(`Deleted CV file: ${cv.fileName}`);
        } catch (error) {
          this.logger.warn(`Failed to delete CV file: ${cv.fileName}`, error);
          // Continue with account deletion even if file deletion fails
        }
      }
    }

    // Delete candidate profile (cascade will delete CVs from DB)
    if (user.candidate) {
      await this.candidateRepository.remove(user.candidate);
      this.logger.log(`Deleted candidate profile for user ${user.email}`);
    }

    // Delete employer profile if exists
    if (user.employer) {
      await this.employerRepository.remove(user.employer);
      this.logger.log(`Deleted employer profile for user ${user.email}`);
    }

    // Delete user account
    await this.userRepository.remove(user);
    this.logger.log(`Deleted user account: ${user.email}`);

    return { message: 'Tài khoản đã được xóa thành công' };
  }
}
