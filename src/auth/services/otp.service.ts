// src/auth/services/otp.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpVerification } from '../../database/entities/otp-verification.entity';
import {
  OtpPurpose,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OtpExpiryTime,
} from '../../common/enums';

/**
 * OTP Service
 * Handles OTP generation, verification, and management
 *
 * UC-CORE-01: Gửi và Xác thực OTP Email
 * - Tạo OTP 6 số và thời gian hết hạn
 * - Lưu trữ OTP đã hash
 * - Xác thực OTP người dùng nhập
 * - Trả về kết quả Thành công/Thất bại
 *
 * Also used in: UC-REG-03, UC-AUTH-03
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
  ) {}

  /**
   * Generate a random 6-digit OTP code
   */
  private generateOtpCode(): string {
    const min = Math.pow(10, OTP_LENGTH - 1);
    const max = Math.pow(10, OTP_LENGTH) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Hash OTP code before storing
   * UC-CORE-01: Lưu trữ OTP đã hash
   */
  private async hashOtp(otpCode: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(otpCode, saltRounds);
  }

  /**
   * Compare OTP code with hashed OTP
   */
  private async compareOtp(
    otpCode: string,
    hashedOtp: string,
  ): Promise<boolean> {
    return await bcrypt.compare(otpCode, hashedOtp);
  }

  /**
   * Create and save a new OTP
   * @param email - User email
   * @param purpose - Purpose of OTP
   * @returns OTP record with code and expiry time
   */
  async createOtp(
    email: string,
    purpose: OtpPurpose,
  ): Promise<{ otpCode: string; expiresAt: Date; expiresInMinutes: number }> {
    // Check rate limit: max 5 OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpCount = await this.otpRepository.count({
      where: {
        email,
        purpose,
        createdAt: LessThan(oneHourAgo),
      },
    });

    if (recentOtpCount >= 5) {
      throw new BadRequestException(
        'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 1 giờ.',
      );
    }

    // Invalidate all previous unused OTPs for this email and purpose
    await this.otpRepository.update(
      {
        email,
        purpose,
        isUsed: false,
        isVerified: false,
      },
      {
        isUsed: true, // Mark as used to invalidate
      },
    );

    // Generate new OTP
    const otpCode = this.generateOtpCode();
    const expiresInMinutes = OtpExpiryTime[purpose];
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Hash OTP before saving (UC-CORE-01: Lưu trữ OTP đã hash)
    const hashedOtp = await this.hashOtp(otpCode);

    // Save OTP to database
    const otp = this.otpRepository.create({
      email,
      otpCode: hashedOtp, // Store hashed OTP
      purpose,
      expiresAt,
      isUsed: false,
      isVerified: false,
      attemptCount: 0,
    });

    await this.otpRepository.save(otp);

    return {
      otpCode,
      expiresAt,
      expiresInMinutes,
    };
  }

  /**
   * Verify OTP code
   * @param email - User email
   * @param otpCode - OTP code to verify
   * @param purpose - Purpose of OTP
   * @returns true if OTP is valid
   * @throws BadRequestException if OTP is invalid or expired
   */
  async verifyOtp(
    email: string,
    otpCode: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    // Find the most recent unused OTP for this email and purpose
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        purpose,
        isUsed: false,
        isVerified: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otp) {
      throw new BadRequestException(
        'Mã OTP không tồn tại hoặc đã được sử dụng.',
      );
    }

    // Check if OTP is expired
    if (new Date() > otp.expiresAt) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    // Check attempt count
    if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã OTP mới.',
      );
    }

    // Verify OTP code (UC-CORE-01: E2 - OTP sai)
    const isOtpValid = await this.compareOtp(otpCode, otp.otpCode);

    if (!isOtpValid) {
      // Increment attempt count
      await this.otpRepository.update(otp.id, {
        attemptCount: otp.attemptCount + 1,
      });

      const remainingAttempts = OTP_MAX_ATTEMPTS - (otp.attemptCount + 1);
      throw new BadRequestException(
        `Mã OTP không đúng. Bạn còn ${remainingAttempts} lần thử.`,
      );
    }

    // Mark OTP as verified and used
    await this.otpRepository.update(otp.id, {
      isVerified: true,
      isUsed: true,
      verifiedAt: new Date(),
    });

    return true;
  }

  /**
   * Clean up expired OTPs (can be called by a cron job)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * Check if an OTP exists and is valid for a given email and purpose
   */
  async hasValidOtp(email: string, purpose: OtpPurpose): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        purpose,
        isUsed: false,
        isVerified: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otp) {
      return false;
    }

    // Check if not expired
    return new Date() <= otp.expiresAt;
  }
}
