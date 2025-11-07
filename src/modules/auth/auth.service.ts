import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { User } from '../users/entities/user.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { Employer } from '../employers/entities/employer.entity';
import { EmployerLocation } from '../employers/entities/employer-location.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
    @InjectRepository(Employer)
    private employerRepo: Repository<Employer>,
    @InjectRepository(EmployerLocation)
    private employerLocationRepo: Repository<EmployerLocation>,
    @InjectRepository(OtpVerification)
    private otpRepo: Repository<OtpVerification>,
    private mailerService: MailerService,
  ) {}

  // === 1. ĐĂNG KÝ ỨNG VIÊN ===
  async registerCandidate(dto: RegisterCandidateDto) {
    const { fullName, email, password } = dto;

    // Kiểm tra email đã tồn tại
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tạo user + candidate trong transaction
    const user = this.userRepo.create({
      email,
      password_hash: await bcrypt.hash(password, 10),
      role: UserRole.CANDIDATE,
      is_verified: false,
      status: UserStatus.PENDING,
    });

    const savedUser = await this.userRepo.save(user);

    const candidate = this.candidateRepo.create({
      user: savedUser,
      fullName: fullName,
    });
    await this.candidateRepo.save(candidate);

    // Tạo OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    await this.otpRepo.save({
      email,
      otp,
      expiresAt,
    });

    // Gửi email
    await this.sendOtpEmail(email, otp);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh.',
      email,
    };
  }

  // === 2. ĐĂNG KÝ NHÀ TUYỂN DỤNG ===
  async registerEmployer(dto: RegisterEmployerDto) {
    const {
      fullName,
      workEmail,
      phone,
      workTitle,
      companyName,
      city,
      ward,
      streetAddress,
      website,
    } = dto;

    // Kiểm tra email đã tồn tại
    const existing = await this.userRepo.findOne({
      where: { email: workEmail },
    });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tạo password tạm thời
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Tạo user (user.status: pending, is verified: false)
    const user = this.userRepo.create({
      email: workEmail,
      password_hash: hashedPassword,
      role: UserRole.EMPLOYER,
      is_verified: false,
      status: UserStatus.PENDING,
    });
    const savedUser = await this.userRepo.save(user);

    // Tạo employer
    const employer = this.employerRepo.create({
      user: savedUser,
      fullName: fullName,
      contactPhone: phone,
      contactEmail: workEmail,
      workTitle: workTitle,
      companyName: companyName,
      website: website,
      isApproved: false,
      status: UserStatus.PENDING,
    });
    const savedEmployer = await this.employerRepo.save(employer);

    // Tạo employer location (headquarters)
    const employerLocation = this.employerLocationRepo.create({
      employer: savedEmployer,
      city,
      ward,
      streetAddress,
      isHeadquarters: true,
    });
    await this.employerLocationRepo.save(employerLocation);

    await this.sendEmployerPendingEmail(workEmail, companyName, fullName);

    return {
      success: true,
      message:
        'Đăng ký thành công! Vui lòng chờ phê duyệt từ quản trị viên (24-48 giờ).',
      email: workEmail,
      estimatedTime: '24-48 giờ',
    };
  }

  private async sendEmployerPendingEmail(
    email: string,
    companyName: string,
    fullName: string,
  ) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Đăng ký nhà tuyển dụng TopJob - Chờ phê duyệt',
        template: 'employer-pending', // src/templates/employer-pending.hbs
        context: {
          companyName,
          fullName,
          estimatedTime: '24-48 giờ',
        },
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-6);
  }

  // === 2. XÁC MINH OTP ===
  async verifyOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;

    const record = await this.otpRepo.findOne({
      where: {
        email,
        otp,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!record) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật user
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    user.is_verified = true;
    user.status = UserStatus.ACTIVE;
    user.email_verified_at = new Date();
    await this.userRepo.save(user);

    // Đánh dấu OTP đã dùng
    record.isUsed = true;
    record.usedAt = new Date();
    await this.otpRepo.save(record);

    return {
      message: 'Xác minh thành công! Bạn có thể đăng nhập.',
      email: user.email,
      role: user.role,
    };
  }

  // === GỬI LẠI OTP ===
  async resendOtp(
    dto: ResendOtpDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || user.is_verified) {
      throw new BadRequestException('Email không hợp lệ hoặc đã được xác minh');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpRepo.update(
      { email: dto.email, isUsed: false },
      { isUsed: true, usedAt: new Date() },
    );

    await this.otpRepo.save({
      email: dto.email,
      otp,
      expiresAt,
      isUsed: false,
    });

    await this.sendOtpEmail(dto.email, otp);

    return { success: true, message: 'Đã gửi lại mã OTP' };
  }

  // === HỖ TRỢ ===
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Mã xác minh TopJob',
      template: 'otp', // src/templates/otp.hbs
      context: {
        otp,
        expiresIn: '10 phút',
      },
    });
  }
}
