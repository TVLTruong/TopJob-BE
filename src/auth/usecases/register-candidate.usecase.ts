// src/auth/usecases/register-candidate.usecase.ts

import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { RegisterCandidateDto } from '../dto/register-candidate.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { UserRole, UserStatus, OtpPurpose } from '../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

/**
 * Use Case: UC-REG-01 - Đăng ký ứng viên
 *
 * Main Flow:
 * 1. Guest selects "Register" and chooses "Candidate" role
 * 2. System displays candidate registration form (Full Name, Email, Password, Confirm Password)
 * 3. Guest fills in information and clicks "Register"
 * 4. System validates data (A1)
 * 5. System checks email doesn't exist in database (E1)
 * 6. System hashes candidate password
 * 7. System creates new user with status = "PENDING_EMAIL_VERIFICATION" and saves hashed password
 * 8. System creates candidate_profile linked to user
 * 9. System executes UC-REG-03 (Email Verification)
 *
 * Alternative Flows:
 * - A1: Invalid data (Step 4): System shows field errors (password mismatch, invalid email format, etc.). Return to Step 2.
 * - E1: Email already exists (Step 5): System shows error "This email is already in use". Use case ends.
 */
@Injectable()
export class RegisterCandidateUseCase {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    private readonly dataSource: DataSource,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Execute registration use case
   * @param dto Registration data
   * @returns Registration response with user info and OTP expiry
   */
  async execute(dto: RegisterCandidateDto): Promise<RegisterResponseDto> {
    // Step 4: Validate data (A1)
    this.validateRegistrationData(dto);

    // Step 5: Check email doesn't exist (E1)
    await this.checkEmailNotExists(dto.email);

    // Step 6-8: Create user and candidate profile in a transaction
    const user = await this.createUserAndCandidate(dto);

    // Step 9: Execute UC-REG-03 (Email Verification)
    const otpData = await this.initiateEmailVerification(user);

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      message:
        'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      otpExpiresAt: otpData.expiresAt,
    };
  }

  /**
   * Step 4: Validate registration data
   * Alternative Flow A1: Invalid data
   */
  private validateRegistrationData(dto: RegisterCandidateDto): void {
    // Check password confirmation matches
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    // Additional validation can be added here
    // DTO validation decorators already handle most cases
  }

  /**
   * Step 5: Check email doesn't exist in database
   * Alternative Flow E1: Email already exists
   */
  private async checkEmailNotExists(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }
  }

  /**
   * Steps 6-8: Create user and candidate profile
   * Uses transaction to ensure data consistency
   */
  private async createUserAndCandidate(
    dto: RegisterCandidateDto,
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 6: Hash password
      const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

      // Step 7: Create user with status = "PENDING_EMAIL_VERIFICATION"
      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: UserRole.CANDIDATE,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
        isVerified: false,
        emailVerifiedAt: null,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // Step 8: Create candidate_profile linked to user
      const candidate = queryRunner.manager.create(Candidate, {
        userId: savedUser.id,
        fullName: dto.fullName,
        // Other fields will be filled during profile completion
      });

      await queryRunner.manager.save(Candidate, candidate);

      // Commit transaction
      await queryRunner.commitTransaction();

      return savedUser;
    } catch {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.',
      );
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Step 9: Initiate email verification (UC-REG-03)
   * Includes UC-CORE-01: Gửi và xác thực OTP Email
   * Creates OTP and sends verification email
   */
  private async initiateEmailVerification(user: User): Promise<{
    expiresAt: Date;
  }> {
    try {
      // UC-CORE-01: Tạo OTP (6 số) và thời gian hết hạn
      const { otpCode, expiresAt, expiresInMinutes } =
        await this.otpService.createOtp(
          user.email,
          OtpPurpose.EMAIL_VERIFICATION,
        );

      // UC-CORE-01: Gửi email chứa mã OTP
      await this.emailService.sendOtpEmail(
        user.email,
        otpCode,
        OtpPurpose.EMAIL_VERIFICATION,
        expiresInMinutes,
      );

      return { expiresAt };
    } catch (error) {
      // UC-CORE-01 E1: Gửi email thất bại
      // If email sending fails, log error but don't fail registration
      // User can request resend later
      console.error('Failed to send verification email:', error);
      throw new InternalServerErrorException(
        'Tài khoản đã được tạo nhưng không thể gửi email xác thực. Vui lòng yêu cầu gửi lại mã.',
      );
    }
  }
}
