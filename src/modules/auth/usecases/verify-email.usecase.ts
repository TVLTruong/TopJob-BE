// src/auth/usecases/verify-email.usecase.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Candidate } from '../../../database/entities/candidate.entity';
import { Employer } from '../../../database/entities/employer.entity';
import { VerifyEmailDto, VerifyEmailResponseDto, ResendOtpDto } from '../dto';
import { UserStatus, UserRole, OtpPurpose } from '../../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

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
   * Verify email using OTP
   * Supports both email verification and password reset
   */
  async execute(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    const purpose = dto.purpose || OtpPurpose.EMAIL_VERIFICATION;

    const user = await this.findUserByEmail(dto.email);

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      this.validateUserStatus(user);
    }

    try {
      await this.otpService.verifyOtp(dto.email, dto.otpCode, purpose);
    } catch (error) {
      console.error('OTP verification failed:', error);
      throw new BadRequestException(
        'Xác thực thất bại. Vui lòng kiểm tra OTP hoặc yêu cầu mã mới.',
      );
    }

    if (purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await this.updateUserStatusBasedOnRole(user);
      await this.sendWelcomeEmail(user);

      return {
        verified: true,
        message: this.getSuccessMessage(user.role),
        userId: user.id,
        email: user.email,
      };
    } else {
      return {
        verified: true,
        message: 'Xác thực OTP thành công. Bạn có thể đặt lại mật khẩu.',
        userId: user.id,
        email: user.email,
      };
    }
  }

  /** Resend OTP to user's email */
  async resendOtp(
    dto: ResendOtpDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    const user = await this.findUserByEmail(dto.email);

    if (user.isVerified) {
      throw new BadRequestException('Email đã được xác thực');
    }

    if (user.status !== UserStatus.PENDING_EMAIL_VERIFICATION) {
      throw new BadRequestException(
        'Tài khoản không ở trạng thái chờ xác thực email',
      );
    }

    // delete previous OTPs for email verification
    await this.otpService.deleteOtpsByEmailAndPurpose(
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    const { otpCode, expiresAt, expiresInMinutes } =
      await this.otpService.createOtp(
        user.email,
        OtpPurpose.EMAIL_VERIFICATION,
      );

    await this.emailService.sendOtpEmail(
      user.email,
      otpCode,
      OtpPurpose.EMAIL_VERIFICATION,
      expiresInMinutes,
    );

    return { message: 'Mã OTP mới đã được gửi đến email của bạn', expiresAt };
  }

  /** Find user by email */
  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  /** Validate user status before verification */
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

  /** Update user status based on role */
  private async updateUserStatusBasedOnRole(user: User): Promise<void> {
    user.isVerified = true;
    user.emailVerifiedAt = new Date();

    if (user.role === UserRole.CANDIDATE) {
      user.status = UserStatus.ACTIVE;
    } else if (user.role === UserRole.EMPLOYER) {
      user.status = UserStatus.PENDING_PROFILE_COMPLETION;
    } else {
      user.status = UserStatus.ACTIVE;
    }

    await this.userRepository.save(user);
  }

  /** Return success message based on role */
  private getSuccessMessage(role: UserRole): string {
    if (role === UserRole.CANDIDATE) {
      return 'Xác thực email thành công! Bạn có thể bắt đầu tìm việc.';
    } else if (role === UserRole.EMPLOYER) {
      return 'Xác thực email thành công! Vui lòng đăng nhập để hoàn tất hồ sơ công ty.';
    }
    return 'Xác thực email thành công!';
  }

  /** Send welcome email to user */
  private async sendWelcomeEmail(user: User): Promise<void> {
    try {
      let fullName = 'User';

      if (user.role === UserRole.CANDIDATE) {
        const candidate = await this.candidateRepository.findOne({
          where: { userId: user.id },
        });
        if (candidate) fullName = candidate.fullName;
      } else if (user.role === UserRole.EMPLOYER) {
        const employer = await this.employerRepository.findOne({
          where: { userId: user.id },
        });
        if (employer) fullName = employer.fullName;
      }

      await this.emailService.sendWelcomeEmail(user.email, fullName);
    } catch (error) {
      console.error('Gửi email chào mừng thất bại:', error);
    }
  }
}
