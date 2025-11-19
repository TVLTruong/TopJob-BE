// src/auth/usecases/login.usecase.ts

import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UserRole, UserStatus } from '../../common/enums';
import { JwtAuthService, JwtPayload } from '../services/jwt.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  /**
   * Authenticate user and return token + redirect URL
   */
  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.findUserByEmail(dto.email);
    await this.validatePassword(dto.password, user.passwordHash);
    this.checkAccountStatus(user);

    const { accessToken, expiresIn } = await this.createSession(user);
    const redirectUrl = this.getRedirectUrl(user);
    const message = this.getLoginMessage(user);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      redirectUrl,
      message,
    };
  }

  /** Find user by email; throw if not found */
  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return user;
  }

  /** Compare password with hash */
  private async validatePassword(
    inputPassword: string,
    hashedPassword: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(inputPassword, hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
  }

  /** Check account status; banned accounts cannot login */
  private checkAccountStatus(user: User): void {
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Tài khoản này đã bị khóa');
    }
  }

  /** Generate JWT token and update last login */
  private async createSession(
    user: User,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.jwtAuthService.generateAccessToken(payload);
    const expiresIn = this.jwtAuthService.getExpiresIn();

    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { accessToken, expiresIn };
  }

  /** Determine redirect URL based on status and role */
  private getRedirectUrl(user: User): string {
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION)
      return '/auth/verify-email';
    if (user.status === UserStatus.PENDING_PROFILE_COMPLETION)
      return '/employer/complete-profile';
    if (user.status === UserStatus.PENDING_APPROVAL)
      return '/employer/pending-approval';
    if (user.status === UserStatus.ACTIVE) {
      switch (user.role) {
        case UserRole.CANDIDATE:
          return '/candidate/dashboard';
        case UserRole.EMPLOYER:
          return '/employer/dashboard';
        case UserRole.ADMIN:
          return '/admin/dashboard';
        default:
          return '/dashboard';
      }
    }
    return '/';
  }

  /** Get user-facing login message */
  private getLoginMessage(user: User): string {
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION)
      return 'Vui lòng xác thực email. Mã OTP đã được gửi.';
    if (user.status === UserStatus.PENDING_PROFILE_COMPLETION)
      return 'Vui lòng hoàn thành hồ sơ công ty.';
    if (user.status === UserStatus.PENDING_APPROVAL)
      return 'Hồ sơ của bạn đang chờ phê duyệt từ quản trị viên.';
    return 'Đăng nhập thành công';
  }
}
