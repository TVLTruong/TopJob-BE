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

/**
 * Use Case: UC-AUTH-01 - Đăng nhập người dùng
 *
 * Main Flow:
 * 1. Guest clicks "Login"
 * 2. System displays single login form (Email, Password)
 * 3. Guest enters Email, Password and clicks "Login" (A1)
 * 4. System checks email exists (E1)
 * 5. System compares hashed password (E1)
 * 6. Authentication success. System checks role and status
 * 7. System routing based on status and role:
 *    - PENDING_EMAIL_VERIFICATION → Redirect to OTP verification (UC-REG-03)
 *    - PENDING_PROFILE_COMPLETION (Employer only) → Redirect to Complete Profile (UC-EMP-01)
 *    - PENDING_APPROVAL (Employer only) → Redirect to "Waiting for approval" page
 *    - BANNED → Error "Your account has been banned"
 *    - ACTIVE + CANDIDATE → Redirect to Candidate Dashboard
 *    - ACTIVE + EMPLOYER → Redirect to Employer Dashboard
 *    - ACTIVE + ADMIN → Redirect to Admin Dashboard
 * 8. System creates login session (if authentication and routing successful)
 *
 * Alternative Flows:
 * - A1: Forgot Password (At Step 3): Guest clicks "Forgot password?". System redirects to UC-AUTH-03
 * - E1: Wrong credentials (At Step 4 or 5): System shows error "Email or password is incorrect". Return to Step 3
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  /**
   * Execute login use case
   * @param dto Login credentials
   * @returns Login response with token and redirect URL
   */
  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    // Step 4: Check email exists (E1)
    const user = await this.findUserByEmail(dto.email);

    // Step 5: Compare hashed password (E1)
    await this.validatePassword(dto.password, user.passwordHash);

    // Step 6-7: Check role and status, determine routing
    this.checkAccountStatus(user);

    // Step 8: Create login session (JWT token)
    const { accessToken, expiresIn } = await this.createSession(user);

    // Get redirect URL based on status and role
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

  /**
   * Step 4: Find user by email
   * E1: Email doesn't exist
   */
  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // E1: Wrong credentials - Don't reveal if email exists
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return user;
  }

  /**
   * Step 5: Validate password
   * E1: Wrong password
   */
  private async validatePassword(
    inputPassword: string,
    hashedPassword: string,
  ): Promise<void> {
    const isPasswordValid = await bcrypt.compare(inputPassword, hashedPassword);

    if (!isPasswordValid) {
      // E1: Wrong credentials
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
  }

  /**
   * Step 6-7: Check account status
   * Handle BANNED status
   */
  private checkAccountStatus(user: User): void {
    // UC-AUTH-01: status = "ĐÃ_KHÓA" → Error
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa');
    }

    // Other statuses are allowed to login but will be redirected accordingly
  }

  /**
   * Step 8: Create login session (JWT token)
   */
  private async createSession(user: User): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.jwtAuthService.generateAccessToken(payload);
    const expiresIn = this.jwtAuthService.getExpiresIn();

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    return { accessToken, expiresIn };
  }

  /**
   * Step 7: Determine redirect URL based on status and role
   * UC-AUTH-01 Routing logic
   */
  private getRedirectUrl(user: User): string {
    // UC-AUTH-01: status = "CHỜ_XÁC_THỰC_EMAIL"
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
      return '/auth/verify-email';
    }

    // UC-AUTH-01: status = "CHỜ_HOÀN_THIỆN_HỒ_SƠ" (Employer only)
    if (user.status === UserStatus.PENDING_PROFILE_COMPLETION) {
      return '/employer/complete-profile';
    }

    // UC-AUTH-01: status = "CHỜ_DUYỆT" (Employer only)
    if (user.status === UserStatus.PENDING_APPROVAL) {
      return '/employer/pending-approval';
    }

    // UC-AUTH-01: status = "ĐANG_HOẠT_ĐỘNG"
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

    // Default fallback
    return '/';
  }

  /**
   * Get appropriate login message based on user status
   */
  private getLoginMessage(user: User): string {
    if (user.status === UserStatus.PENDING_EMAIL_VERIFICATION) {
      return 'Vui lòng kích hoạt tài khoản. Mã OTP đã được gửi đến email của bạn.';
    }

    if (user.status === UserStatus.PENDING_PROFILE_COMPLETION) {
      return 'Vui lòng hoàn thiện hồ sơ công ty để tiếp tục.';
    }

    if (user.status === UserStatus.PENDING_APPROVAL) {
      return 'Hồ sơ của bạn đang chờ Admin duyệt.';
    }

    return 'Đăng nhập thành công!';
  }
}
