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

/**
 * Use Case: UC-AUTH-03 - Đặt lại mật khẩu bằng OTP
 *
 * Main Flow:
 * 1. Guest clicks "Forgot password". System displays page to enter email
 * 2. Guest enters email and clicks "Send"
 * 3. System checks email exists (E1)
 * 4. System executes <<include UC-CORE-01>> (Send and Verify OTP) for that email
 * 5. If UC-CORE-01 returns "Success":
 * 6. System redirects user to "Create new password" page
 * 7. Guest enters "New Password" and "Confirm New Password"
 * 8. System validates (match, strong enough...) (E3)
 * 9. System hashes new password
 * 10. System updates new password in database
 * 11. System shows "Password changed successfully" and redirects to Login page
 *
 * Alternative Flows:
 * - E1: Email doesn't exist (Step 3): System (for security) doesn't show error,
 *   still displays "Request sent, please check email (if email exists)". Use case ends.
 * - E2: Verification failed (Step 4): If UC-CORE-01 returns "Failed", show error "Verification failed"
 * - E3: New password invalid (Step 8): Show error (e.g. "Passwords don't match"), return to Step 7
 */
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
   * Step 1-4: Send OTP to email for password reset
   * UC-AUTH-03: Request password reset
   */
  async requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    // Step 3: Check email exists
    // E1: For security, don't reveal if email exists
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // UC-AUTH-03 E1: Security - always return same message
    if (!user) {
      return {
        message:
          'Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra email.',
      };
    }

    // Step 4: UC-CORE-01 - Send OTP
    try {
      const { otpCode, expiresAt, expiresInMinutes } =
        await this.otpService.createOtp(user.email, OtpPurpose.PASSWORD_RESET);

      await this.emailService.sendOtpEmail(
        user.email,
        otpCode,
        OtpPurpose.PASSWORD_RESET,
        expiresInMinutes,
      );

      return {
        message:
          'Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra email.',
        expiresAt,
      };
    } catch (err) {
      // UC-CORE-01 E1: Send email failed
      console.error('Failed to send password reset email:', err);
      // Still return success message for security
      return {
        message:
          'Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra email.',
      };
    }
  }

  /**
   * Step 5-11: Verify OTP and reset password
   * UC-AUTH-03: Reset password with OTP
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Step 8: Validate new password (E3)
    this.validatePasswordReset(dto);

    // Find user
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này');
    }

    // Step 5: UC-CORE-01 - Verify OTP (E2)
    try {
      await this.otpService.verifyOtp(
        dto.email,
        dto.otpCode,
        OtpPurpose.PASSWORD_RESET,
      );
    } catch {
      // UC-AUTH-03 E2: Verification failed
      throw new BadRequestException(
        'Xác thực thất bại. Mã OTP không đúng hoặc đã hết hạn.',
      );
    }

    // Step 9: Hash new password
    const newPasswordHash = await bcrypt.hash(
      dto.newPassword,
      this.SALT_ROUNDS,
    );

    // Step 10: Update password in database
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    // Step 11: Success message
    return {
      message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  /**
   * Step 8: Validate password reset data
   * UC-AUTH-03 E3: Invalid new password
   */
  private validatePasswordReset(dto: ResetPasswordDto): void {
    // Check passwords match
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Additional validation handled by DTO decorators
  }
}
