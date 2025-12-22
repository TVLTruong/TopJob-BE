// src/auth/usecases/register-employer.usecase.ts

import {
  Injectable,
  ConflictException,
  // BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../database/entities/user.entity';
import { Employer } from '../../../database/entities/employer.entity';
import { RegisterEmployerDto } from '../dto/register-employer.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import {
  UserRole,
  UserStatus,
  OtpPurpose,
  EmployerProfileStatus,
} from '../../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

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
   * Register a new employer user and initiate email verification
   * @param dto Registration data
   */
  async execute(dto: RegisterEmployerDto): Promise<RegisterResponseDto> {
    // this.validateRegistrationData(dto);
    await this.checkEmailNotExists(dto.email);

    const user = await this.createUserAndEmployer(dto);
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

  /** Validate registration input */
  // private validateRegistrationData(dto: RegisterEmployerDto): void {
  //   if (dto.password !== dto.confirmPassword) {
  //     throw new BadRequestException('Mật khẩu xác nhận không khớp');
  //   }
  //   // Additional validation handled by DTO decorators
  // }

  /** Ensure email is not already used */
  private async checkEmailNotExists(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }
  }

  /** Create user and employer profile in a transaction */
  private async createUserAndEmployer(dto: RegisterEmployerDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: UserRole.EMPLOYER,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
        isVerified: false,
        emailVerifiedAt: null,
      });
      const savedUser = await queryRunner.manager.save(User, user);

      const employer = queryRunner.manager.create(Employer, {
        userId: savedUser.id,
        fullName: dto.fullName,
        workTitle: dto.workTitle,
        companyName: dto.companyName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.email.toLowerCase(),
        profileStatus: EmployerProfileStatus.PENDING_EDIT_APPROVAL, // Will be APPROVED after profile completion
      });
      await queryRunner.manager.save(Employer, employer);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        'Tạo tài khoản thất bại. Vui lòng thử lại.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /** Generate OTP and send verification email */
  private async initiateEmailVerification(
    user: User,
  ): Promise<{ expiresAt: Date }> {
    try {
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

      return { expiresAt };
    } catch (error) {
      console.error('Gửi email xác thực thất bại:', error);
      throw new InternalServerErrorException(
        'Tài khoản đã được tạo nhưng không gửi được email xác thực. Vui lòng yêu cầu mã OTP mới.',
      );
    }
  }
}
