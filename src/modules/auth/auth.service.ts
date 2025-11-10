import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
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
import { EmployerProfileStatus } from '../../common/enums/employer-status.enum';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { Employer } from '../employers/entities/employer.entity';
import { EmployerLocation } from '../employers/entities/employer-location.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import type { RequestUser } from '../../common/interfaces/request-user.interface'; // 👈 THÊM

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
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger = new Logger(AuthService.name),
  ) {}

  // === 1. ĐĂNG KÝ ỨNG VIÊN ===
  async registerCandidate(dto: RegisterCandidateDto) {
    const { fullName, email, password } = dto;

    // Kiểm tra email đã tồn tại
    const existing = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tạo user + candidate trong transaction
    const user = this.userRepo.create({
      email: email.toLowerCase(),
      password_hash: await bcrypt.hash(password, 10),
      role: UserRole.CANDIDATE,
      status: UserStatus.VERIFIED,
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
      email: email.toLowerCase(),
      otp,
      expiresAt,
    });

    // Gửi email
    await this.sendOtpEmail(email.toLowerCase(), otp);

    return {
      message: 'Đăng ký thành công.',
      email: email.toLowerCase(),
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
      where: { email: workEmail.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tạo password tạm thời
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Tạo user (user.status: verified)
    const user = this.userRepo.create({
      email: workEmail.toLowerCase(),
      password_hash: hashedPassword,
      role: UserRole.EMPLOYER,
      status: UserStatus.VERIFIED,
    });
    const savedUser = await this.userRepo.save(user);

    // Tạo employer
    const employer = this.employerRepo.create({
      user: savedUser,
      fullName: fullName,
      contactPhone: phone,
      contactEmail: workEmail.toLowerCase(),
      workTitle: workTitle,
      companyName: companyName,
      website: website,
      status: EmployerProfileStatus.PENDING_APPROVAL,
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

    // Xác thực email nhà tuyển dụng bằng OTP
    await this.sendOtpEmail(workEmail.toLowerCase(), tempPassword);

    await this.sendEmployerPendingEmail(workEmail, companyName, fullName);

    return {
      success: true,
      message:
        'Đăng ký thành công! Vui lòng chờ phê duyệt từ quản trị viên (24-48 giờ).',
      email: workEmail.toLowerCase(),
      estimatedTime: '24-48 giờ',
    };
  }

  // === 3. ĐĂNG NHẬP ===
  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    const { email, password } = dto;

    // 1. Tìm user bằng email (dùng 'this.userRepo' y hệt code của TVLTruong)
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isFirstLogin = user.last_login_at === null;

    // 2. So sánh mật khẩu (dùng 'password_hash' từ Entity đã được 'TVLTruong' update)
    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 3. Kiểm tra trạng thái tài khoản (dùng 'status' từ Entity)
    if (user.status !== UserStatus.ACTIVE) {
      if (user.status === UserStatus.PENDING) {
        throw new UnauthorizedException(
          'Tài khoản đang chờ phê duyệt/xác minh',
        );
      }
      if (user.status === UserStatus.BANNED) {
        throw new UnauthorizedException('Tài khoản đã bị khóa');
      }
    }

    // // 3b. Kiểm tra 'is_verified' (từ logic OTP của TVLTruong)
    // if (!user.is_verified) {
    //   throw new UnauthorizedException('Tài khoản chưa được xác minh OTP');
    // }

    // 4. Cập nhật last_login_at (dùng 'last_login_at' từ Entity)
    user.last_login_at = new Date();
    await this.userRepo.save(user); // 👈 (AuthService tự save, không cần UsersService)

    // 5. Tạo Payload (Nội dung Token)
    const payload: RequestUser = {
      // (Dùng interface RequestUser)
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 6. Tạo và trả về Token
    return {
      access_token: await this.jwtService.signAsync(payload),
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

    // Tìm OTP hợp lệ
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

    if (user.role === UserRole.CANDIDATE) {
      user.status = UserStatus.ACTIVE;
    } else if (user.role === UserRole.EMPLOYER) {
      user.status = UserStatus.PENDING;
    }
    user.email_verified_at = new Date();
    await this.userRepo.save(user);

    // Đánh dấu OTP đã dùng
    record.isUsed = true;
    record.usedAt = new Date();
    await this.otpRepo.save(record);

    return {
      message: 'Xác minh thành công!',
      email: user.email,
      role: user.role,
    };
  }

  // === GỬI LẠI OTP ===
  async resendOtp(
    dto: ResendOtpDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user || user.status === UserStatus.VERIFIED) {
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
