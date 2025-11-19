// src/auth/usecases/register-employer.usecase.ts

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
import { Employer } from '../../database/entities/employer.entity';
import { RegisterEmployerDto } from '../dto/register-employer.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import {
  UserRole,
  UserStatus,
  OtpPurpose,
  EmployerProfileStatus,
} from '../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

/**
 * Use Case: UC-REG-02 - Đăng ký Nhà tuyển dụng
 *
 * Main Flow:
 * 1. Guest selects "Register" → Role "Employer"
 * 2. System displays employer registration form (Full Name, Work Title, Email, Phone, Company Name, Password, Confirm Password)
 * 3. Guest fills in information and clicks "Register"
 * 4. System validates data (A1)
 * 5. System checks email doesn't exist (E1)
 * 6. System hashes password
 * 7. System creates new user with status = "PENDING_EMAIL_VERIFICATION"
 * 8. System creates employer_profile (status "EMPTY") linked to user
 * 9. System starts UC-REG-03 (Email Verification)
 *
 * Alternative Flows:
 * - A1: Invalid data (Step 4): System shows field errors. Return to Step 3.
 * - E1: Email already exists (Step 5): System shows error "This email is already in use". Use case ends.
 */
@Injectable()
export class RegisterEmployerUseCase {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Employer)
    private readonly employerRepository: Repository<Employer>,
    private readonly dataSource: DataSource,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Execute registration use case
   * @param dto Registration data
   * @returns Registration response with user info and OTP expiry
   */
  async execute(dto: RegisterEmployerDto): Promise<RegisterResponseDto> {
    // Step 4: Validate data (A1)
    this.validateRegistrationData(dto);

    // Step 5: Check email doesn't exist (E1)
    await this.checkEmailNotExists(dto.email);

    // Step 6-8: Create user and employer profile in a transaction
    const user = await this.createUserAndEmployer(dto);

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
  private validateRegistrationData(dto: RegisterEmployerDto): void {
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
   * Steps 6-8: Create user and employer profile
   * Uses transaction to ensure data consistency
   */
  private async createUserAndEmployer(dto: RegisterEmployerDto): Promise<User> {
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
        role: UserRole.EMPLOYER,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
        isVerified: false,
        emailVerifiedAt: null,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // Step 8: Create employer_profile (status "EMPTY") linked to user
      const employer = queryRunner.manager.create(Employer, {
        userId: savedUser.id,
        fullName: dto.fullName,
        workTitle: dto.workTitle,
        companyName: dto.companyName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.email.toLowerCase(),
        // Set profile status to APPROVED (empty profile, will be completed later)
        profileStatus: EmployerProfileStatus.APPROVED,
        // Other fields will be filled during profile completion (UC-EMP-01)
      });

      await queryRunner.manager.save(Employer, employer);

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
