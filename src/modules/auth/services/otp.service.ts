// src/auth/services/otp.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OtpVerification } from '../../../database/entities/otp-verification.entity';
import {
  OtpPurpose,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OtpExpiryTime,
} from '../../../common/enums';

/**
 * OTP Service
 * - Generate, store, verify OTP (UC-CORE-01)
 * - Shared for registration / login / email verification
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpVerification)
    private readonly otpRepository: Repository<OtpVerification>,
  ) {}

  /** Generate random 6-digit OTP */
  private generateOtp(): string {
    const min = 10 ** (OTP_LENGTH - 1);
    const max = 10 ** OTP_LENGTH - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  private hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 10);
  }

  private compareOtp(otp: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(otp, hashed);
  }

  /**
   * Create new OTP:
   * - Limit request frequency
   * - Invalidate old OTPs
   * - Store hashed OTP
   */
  async createOtp(
    email: string,
    purpose: OtpPurpose,
  ): Promise<{ otpCode: string; expiresAt: Date; expiresInMinutes: number }> {
    // Check max 5 requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const requestCount = await this.otpRepository.count({
      where: { email, purpose, createdAt: LessThan(oneHourAgo) },
    });

    if (requestCount >= 5) {
      throw new BadRequestException(
        'Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 1 giờ.',
      );
    }

    // Invalidate previous OTPs
    await this.otpRepository.update(
      { email, purpose, isUsed: false, isVerified: false },
      { isUsed: true },
    );

    // Create new OTP
    const otpCode = this.generateOtp();
    const expiresInMinutes = OtpExpiryTime[purpose];
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const otp = this.otpRepository.create({
      email,
      purpose,
      otpCode: await this.hashOtp(otpCode), // Store hashed version
      expiresAt,
      isUsed: false,
      isVerified: false,
      attemptCount: 0,
    });

    await this.otpRepository.save(otp);

    return { otpCode, expiresAt, expiresInMinutes };
  }

  /**
   * Verify OTP:
   * - Check existence
   * - Check expiration
   * - Check wrong attempt count
   * - Compare OTP code
   */
  async verifyOtp(
    email: string,
    otpCode: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { email, purpose, isUsed: false, isVerified: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp)
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã dùng.');

    if (new Date() > otp.expiresAt) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.',
      );
    }

    const isValid = await this.compareOtp(otpCode, otp.otpCode);

    if (!isValid) {
      await this.otpRepository.update(otp.id, {
        attemptCount: otp.attemptCount + 1,
      });

      const remain = OTP_MAX_ATTEMPTS - (otp.attemptCount + 1);
      throw new BadRequestException(
        `Mã OTP không đúng. Bạn còn ${remain} lần thử.`,
      );
    }

    // Mark OTP as successfully verified
    await this.otpRepository.update(otp.id, {
      isVerified: true,
      isUsed: true,
      verifiedAt: new Date(),
    });

    return true;
  }

  /** Delete OTPs by email and purpose */
  async deleteOtpsByEmailAndPurpose(
    email: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.otpRepository.delete({ email, purpose });
  }

  // Delete expired OTPs (for cron job)
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected ?? 0;
  }

  // Check if email has a valid non-expired OTP
  async hasValidOtp(email: string, purpose: OtpPurpose): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { email, purpose, isUsed: false, isVerified: false },
      order: { createdAt: 'DESC' },
    });

    return !!otp && new Date() <= otp.expiresAt;
  }
}
