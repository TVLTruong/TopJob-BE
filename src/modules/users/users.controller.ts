// src/modules/users/users.controller.ts

import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import type { JwtPayload } from '../auth/services/jwt.service';
import { UserResponseDto, UpdatePasswordDto, UpdateUserInfoDto } from './dto';

/**
 * Users Controller
 * Handles user management endpoints
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user info
   * GET /users/me
   */
  @Get('me')
  @ApiOperation({
    summary: 'Lấy thông tin tài khoản của tôi',
    description:
      'Lấy thông tin tài khoản của user đang đăng nhập (bao gồm thông tin cơ bản của profile)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập',
  })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.usersService.getCurrentUser(user.sub);
  }

  /**
   * Get profile completion status
   * GET /users/me/profile-status
   */
  @Get('me/profile-status')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái hoàn thiện hồ sơ',
    description:
      'Lấy thông tin về các trường còn thiếu và bước tiếp theo cần thực hiện',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    schema: {
      type: 'object',
      properties: {
        isComplete: { type: 'boolean', description: 'Hồ sơ đã hoàn thiện' },
        missingFields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Danh sách các trường còn thiếu',
        },
        nextStep: { type: 'string', description: 'Hướng dẫn bước tiếp theo' },
      },
    },
  })
  async getProfileStatus(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfileCompletionStatus(user.sub);
  }

  /**
   * Update password
   * PUT /users/me/password
   */
  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đổi mật khẩu',
    description: 'Đổi mật khẩu cho tài khoản đang đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đổi mật khẩu thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đổi mật khẩu thành công' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Mật khẩu hiện tại không đúng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  async updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.updatePassword(user.sub, dto);
  }

  /**
   * Request OTP for updating account info
   * POST /users/me/request-update-otp
   */
  @Post('me/request-update-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu mã OTP để cập nhật thông tin tài khoản',
    description:
      'Gửi mã OTP đến email để xác thực việc cập nhật thông tin tài khoản',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mã OTP đã được gửi',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mã OTP đã được gửi đến email của bạn',
        },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async requestUpdateInfoOtp(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string; expiresAt: Date }> {
    return this.usersService.requestUpdateInfoOtp(user.sub);
  }

  /**
   * Update account information with OTP
   * PUT /users/me/info
   */
  @Put('me/update-info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật thông tin tài khoản',
    description:
      'Cập nhật fullName, workTitle, contactEmail, contactPhone với xác thực OTP',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thông tin thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Cập nhật thông tin tài khoản thành công',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async updateUserInfo(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserInfoDto,
  ): Promise<{ message: string }> {
    return this.usersService.updateUserInfo(user.sub, dto);
  }

  /**
   * Request OTP for password change
   * POST /users/me/request-password-otp
   */
  @Post('me/request-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu mã OTP để đổi mật khẩu',
    description: 'Gửi mã OTP đến email để xác thực việc đổi mật khẩu',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mã OTP đã được gửi',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mã OTP đã được gửi đến email của bạn',
        },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async requestPasswordChangeOtp(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string; expiresAt: Date }> {
    return this.usersService.requestPasswordChangeOtp(user.sub);
  }

  /**
   * Update password with OTP
   * PUT /users/me/password-with-otp
   */
  @Put('me/password-with-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đổi mật khẩu với xác thực OTP',
    description: 'Đổi mật khẩu với mã OTP xác thực',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đổi mật khẩu thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đổi mật khẩu thành công' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Mật khẩu hiện tại không đúng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async updatePasswordWithOtp(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { currentPassword: string; newPassword: string; otpCode: string },
  ): Promise<{ message: string }> {
    return this.usersService.updatePasswordWithOtp(
      user.sub,
      body.currentPassword,
      body.newPassword,
      body.otpCode,
    );
  }
}
