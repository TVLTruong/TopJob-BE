// src/auth/usecases/verify-email.usecase.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { Employer } from '../../database/entities/employer.entity';
import { VerifyEmailDto, VerifyEmailResponseDto, ResendOtpDto } from '../dto';
import { UserStatus, UserRole, OtpPurpose } from '../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

/**
 * Use Case: UC-REG-03 - Xác thực Email Đăng ký
 *
 * Includes: UC-CORE-01 - Gửi và Xác thực OTP Email
 *
 * Main Flow:
 * 1. (From UC-REG-01/UC-REG-02) System gets email of newly created account
 * 2. System executes <<include UC-CORE-01>> (Send and Verify OTP) with that email
 * 3. If UC-CORE-01 returns "Success":
 * 4. System checks user role:
 *    - If Candidate: Update user.status to "ACTIVE". Redirect to Candidate Dashboard
 *    - If Employer: Update user.status to "PENDING_PROFILE_COMPLETION".
 *      Redirect to Login with message "Verification successful! Please login to complete company profile."
 *
 * Alternative Flows:
 * - E1: Verification failed: If UC-CORE-01 returns "Failed" (OTP expired),
 *   show error "Verification failed, please try again later"
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Execute email verification use case
   * UC-REG-03: Xác thực email đăng ký
   * UC-CORE-01: Include - Gửi và xác thực OTP
   *
   * @param dto Verification data (email and OTP code)
   * @returns Verification response
   */
  async execute(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    // Step 1: Find user and validate status
    const user = await this.findUserByEmail(dto.email);
    this.validateUserStatus(user);

    // Step 2: UC-CORE-01 - Verify OTP (E1: Xác thực thất bại)
    try {
      await this.otpService.verifyOtp(
        dto.email,
        dto.otpCode,
        OtpPurpose.EMAIL_VERIFICATION,
      );
    } catch (error) {
      // UC-REG-03 E1: Xác thực thất bại
      console.error('OTP verification failed:', error);
      throw new BadRequestException(
        'Xác thực thất bại. Vui lòng kiểm tra lại mã OTP hoặc yêu cầu mã mới.',
      );
    }

    // Step 3-4: UC-REG-03 - If UC-CORE-01 success, check user role
    await this.updateUserStatusBasedOnRole(user);

    // Step 5: Send welcome email
    await this.sendWelcomeEmail(user);

    return {
      verified: true,
      message: this.getSuccessMessage(user.role),
      userId: user.id,
      email: user.email,
    };
  }

  /**
   * Resend OTP to user's email
   * @param dto Resend OTP data (email)
   */
  async resendOtp(dto: ResendOtpDto): Promise<{
    message: string;
    expiresAt: Date;
  }> {
    // Find user
    const user = await this.findUserByEmail(dto.email);

    // Check if user is already verified
    if (user.isVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    // Check if user status is pending verification
    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new BadRequestException(
        'Tài khoản không ở trạng thái chờ xác thực email',
      );
    }

    // Create new OTP
    const { otpCode, expiresAt, expiresInMinutes } =
      await this.otpService.createOtp(
        user.email,
        OtpPurpose.EMAIL_VERIFICATION,
      );

    // Send OTP email
    await this.emailService.sendOtpEmail(
      user.email,
      otpCode,
      OtpPurpose.EMAIL_VERIFICATION,
      expiresInMinutes,
    );

    return {
      message: 'Mã OTP mới đã được gửi đến email của bạn',
      expiresAt,
    };
  }

  /**
   * Find user by email
   * @throws NotFoundException if user not found
   */
  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['candidate'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này');
    }

    return user;
  }

  /**
   * Validate user status before verification
   * @throws BadRequestException if user is already verified or has invalid status
   */
  private validateUserStatus(user: User): void {
    if (user.isVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new BadRequestException(
        'Tài khoản không ở trạng thái chờ xác thực email',
      );
    }
  }

  /**
   * UC-REG-03 Step 4: Update user status based on role
   * - Candidate: status = ACTIVE → redirect to Dashboard
   * - Employer: status = PENDING_PROFILE_COMPLETION → redirect to Login
   */
  private async updateUserStatusBasedOnRole(user: User): Promise<void> {
    // Set common verification flags
    user.isVerified = true;
    user.emailVerifiedAt = new Date();

    // UC-REG-03: Kiểm tra vai trò
    if (user.role === UserRole.CANDIDATE) {
      // Nếu là Ứng viên: Cập nhật status thành ĐANG_HOẠT_ĐỘNG
      user.status = UserStatus.ACTIVE;
    } else if (user.role === UserRole.EMPLOYER) {
      // Nếu là Nhà tuyển dụng: Cập nhật status thành CHỜ_HOÀN_THIỆN_HỒ_SƠ
      user.status = UserStatus.PENDING_PROFILE_COMPLETION;
    } else {
      // Default: ACTIVE for other roles
      user.status = UserStatus.ACTIVE;
    }

    await this.userRepository.save(user);
  }

  /**
   * Get success message based on user role
   */
  private getSuccessMessage(role: UserRole): string {
    if (role === UserRole.CANDIDATE) {
      return 'Xác thực email thành công! Bạn có thể bắt đầu tìm kiếm việc làm.';
    } else if (role === UserRole.EMPLOYER) {
      return 'Xác thực email thành công! Vui lòng đăng nhập để hoàn thiện hồ sơ công ty.';
    }
    return 'Xác thực email thành công!';
  }

  /**
   * Send welcome email to newly verified user
   * Handles both Candidate and Employer
   */
  private async sendWelcomeEmail(user: User): Promise<void> {
    try {
      let fullName = 'Người dùng';

      if (user.role === UserRole.CANDIDATE) {
        // Get candidate full name
        const candidate = await this.candidateRepository.findOne({
          where: { userId: user.id },
        });
        if (candidate) {
          fullName = candidate.fullName;
        }
      } else if (user.role === UserRole.EMPLOYER) {
        // Get employer full name
        const employer = await this.employerRepository.findOne({
          where: { userId: user.id },
        });
        if (employer) {
          fullName = employer.fullName;
        }
      }

      await this.emailService.sendWelcomeEmail(user.email, fullName);
    } catch (error) {
      // UC-CORE-01 E1: Log error but don't fail verification if welcome email fails
      console.error('Failed to send welcome email:', error);
    }
  }
}
