// src/auth/usecases/forgot-password.usecase.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  ForgotPasswordResponseDto,
} from '../dto/forgot-password.dto';
import { OtpPurpose } from '../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Sends OTP for password reset.
   * Always returns a generic message for security.
   */
  async requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Always return a generic response regardless of user existence
    const responseMessage =
      'Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư.';

    if (!user) {
      return { message: responseMessage };
    }

    try {
      const { otpCode, expiresAt, expiresInMinutes } =
        await this.otpService.createOtp(user.email, OtpPurpose.PASSWORD_RESET);

      await this.emailService.sendOtpEmail(
        user.email,
        otpCode,
        OtpPurpose.PASSWORD_RESET,
        expiresInMinutes,
      );

      return { message: responseMessage, expiresAt };
    } catch (err) {
      console.error('Gửi OTP đặt lại mật khẩu thất bại:', err);
      return { message: responseMessage };
    }
  }

  /**
   * Resets user password after OTP verification.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    this.validatePasswordReset(dto);

    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này.');
    }

    const newPasswordHash = await bcrypt.hash(
      dto.newPassword,
      this.SALT_ROUNDS,
    );

    user.passwordHash = newPasswordHash;

    try {
      await this.userRepository.save(user);

      return {
        message:
          'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
      };
    } catch {
      throw new BadRequestException(
        'Đặt lại mật khẩu thất bại. Vui lòng thử lại sau.',
      );
    }
  }

  /**
   * Validates new password and confirmation.
   */
  private validatePasswordReset(dto: ResetPasswordDto): void {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp.');
    }
  }
}
