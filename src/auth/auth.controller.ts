// src/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import {
  RegisterCandidateUseCase,
  RegisterEmployerUseCase,
  VerifyEmailUseCase,
  LoginUseCase,
  LogoutUseCase,
  ForgotPasswordUseCase,
} from './usecases';
import {
  RegisterCandidateDto,
  RegisterEmployerDto,
  RegisterResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
  ResendOtpDto,
  LoginDto,
  LoginResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ForgotPasswordResponseDto,
} from './dto';

/**
 * Auth Controller
 * Handles authentication and registration endpoints
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerCandidateUseCase: RegisterCandidateUseCase,
    private readonly registerEmployerUseCase: RegisterEmployerUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
  ) {}

  /**
   * UC-REG-01: Register Candidate
   * POST /auth/register/candidate
   */
  @Post('register/candidate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Đăng ký tài khoản ứng viên',
    description:
      'Tạo tài khoản mới cho ứng viên và gửi email xác thực (UC-REG-01)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký thành công. Email xác thực đã được gửi.',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ (validation error)',
  })
  @ApiConflictResponse({
    description: 'Email đã được sử dụng',
  })
  async registerCandidate(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: RegisterCandidateDto,
  ): Promise<RegisterResponseDto> {
    return await this.registerCandidateUseCase.execute(dto);
  }

  /**
   * UC-REG-02: Register Employer
   * POST /auth/register/employer
   */
  @Post('register/employer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Đăng ký tài khoản nhà tuyển dụng',
    description:
      'Tạo tài khoản mới cho nhà tuyển dụng và gửi email xác thực (UC-REG-02)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đăng ký thành công. Email xác thực đã được gửi.',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ (validation error)',
  })
  @ApiConflictResponse({
    description: 'Email đã được sử dụng',
  })
  async registerEmployer(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: RegisterEmployerDto,
  ): Promise<RegisterResponseDto> {
    return await this.registerEmployerUseCase.execute(dto);
  }

  /**
   * UC-REG-03: Verify Email
   * POST /auth/verify-email
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xác thực email',
    description: 'Xác thực email bằng mã OTP (UC-REG-03)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xác thực email thành công',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async verifyEmail(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    return await this.verifyEmailUseCase.execute(dto);
  }

  /**
   * Resend OTP for Email Verification
   * POST /auth/resend-otp
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gửi lại mã OTP',
    description: 'Gửi lại mã OTP xác thực email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mã OTP mới đã được gửi',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mã OTP mới đã được gửi đến email của bạn',
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-11-18T10:30:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Email đã được xác thực hoặc yêu cầu quá nhiều lần',
  })
  async resendOtp(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ResendOtpDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    return await this.verifyEmailUseCase.resendOtp(dto);
  }

  /**
   * UC-AUTH-01: Login
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập với email và mật khẩu (UC-AUTH-01)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng nhập thành công',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ',
  })
  async login(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: LoginDto,
  ): Promise<LoginResponseDto> {
    return await this.loginUseCase.execute(dto);
  }

  /**
   * UC-AUTH-02: Logout
   * POST /auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Đăng xuất và hủy phiên đăng nhập (UC-AUTH-02)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đăng xuất thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đăng xuất thành công' },
        redirectUrl: { type: 'string', example: '/' },
      },
    },
  })
  async logout(
    // TODO: Add @CurrentUser() decorator to get userId from JWT
    // @CurrentUser() userId: string,
  ): Promise<{ message: string; redirectUrl: string }> {
    // For now, use placeholder userId
    // In production, extract userId from JWT token
    const userId = 'placeholder-user-id';
    return await this.logoutUseCase.execute(userId);
  }

  /**
   * UC-AUTH-03: Forgot Password - Request OTP
   * POST /auth/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quên mật khẩu - Gửi OTP',
    description: 'Gửi mã OTP đến email để đặt lại mật khẩu (UC-AUTH-03)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP đã được gửi (nếu email tồn tại)',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return await this.forgotPasswordUseCase.requestPasswordReset(dto);
  }

  /**
   * UC-AUTH-03: Reset Password with OTP
   * POST /auth/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu với mã OTP (UC-AUTH-03)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đổi mật khẩu thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Đổi mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dữ liệu không hợp lệ hoặc OTP không đúng',
  })
  async resetPassword(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.forgotPasswordUseCase.resetPassword(dto);
  }
}
