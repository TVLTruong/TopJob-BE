// src/auth/usecases/register-candidate.usecase.ts

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
import { Candidate } from '../../../database/entities/candidate.entity';
import { RegisterCandidateDto } from '../dto/register-candidate.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { UserRole, UserStatus, OtpPurpose } from '../../../common/enums';
import { OtpService } from '../services/otp.service';
import { EmailService } from '../services/email.service';

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
   * Register a new candidate user and initiate email verification
   * @param dto Registration data
   */
  async execute(dto: RegisterCandidateDto): Promise<RegisterResponseDto> {
    // this.validateRegistrationData(dto);
    await this.checkEmailNotExists(dto.email);

    const user = await this.createUserAndCandidate(dto);
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
  // private validateRegistrationData(dto: RegisterCandidateDto): void {
  //   if (dto.password !== dto.confirmPassword) {
  //     throw new BadRequestException('Mật khẩu xác nhận không khớp');
  //   }
  //   // Additional validations handled by DTO decorators
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

  /** Create user and candidate profile in a transaction */
  private async createUserAndCandidate(
    dto: RegisterCandidateDto,
  ): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

      const user = queryRunner.manager.create(User, {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: UserRole.CANDIDATE,
        status: UserStatus.PENDING_EMAIL_VERIFICATION,
        isVerified: false,
        emailVerifiedAt: null,
      });
      const savedUser = await queryRunner.manager.save(User, user);

      const candidate = queryRunner.manager.create(Candidate, {
        userId: savedUser.id,
        fullName: dto.fullName,
      });
      await queryRunner.manager.save(Candidate, candidate);

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
