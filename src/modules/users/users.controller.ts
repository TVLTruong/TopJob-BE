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
import type { AuthenticatedUser } from '../../common/types/express';
import { UserResponseDto, UpdatePasswordDto, UpdateUserInfoDto, UpdateEmailDto, DeleteAccountDto } from './dto';

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
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    console.log('[GET_ME] JWT Payload:', { email: user.email, userId: user.id, role: user.role });
    return this.usersService.getCurrentUser(user.id);
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
  async getProfileStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfileCompletionStatus(user.id);
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
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.updatePassword(user.id, dto);
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; expiresAt: Date }> {
    return this.usersService.requestUpdateInfoOtp(user.id);
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
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserInfoDto,
  ): Promise<{ message: string }> {
    return this.usersService.updateUserInfo(user.id, dto);
  }

  /**
   * Request OTP for password change
   * POST /users/me/request-password-otp
   */
  @Post('me/request-password-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; expiresAt: Date }> {
    console.log('[REQUEST_PASSWORD_CHANGE_OTP] User:', user.email, 'UserId:', user.id);
    return this.usersService.requestPasswordChangeOtp(user.id);
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
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: { currentPassword: string; newPassword: string; otpCode: string },
  ): Promise<{ message: string }> {
    return this.usersService.updatePasswordWithOtp(
      user.id,
      body.currentPassword,
      body.newPassword,
      body.otpCode,
    );
  }

  /**
   * Request OTP for email change
   * POST /users/me/request-email-change-otp
   */
  @Post('me/request-email-change-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu mã OTP để đổi email',
    description: 'Gửi mã OTP đến email hiện tại để xác thực việc đổi email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mã OTP đã được gửi',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mã OTP đã được gửi đến email hiện tại của bạn',
        },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async requestEmailChangeOtp(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; expiresAt: Date }> {
    console.log('[REQUEST_EMAIL_CHANGE_OTP] User:', user.email, 'UserId:', user.id);
    return this.usersService.requestEmailChangeOtp(user.id);
  }

  /**
   * Update email with OTP
   * PUT /users/me/email
   */
  @Put('me/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đổi email với xác thực OTP',
    description: 'Đổi email tài khoản với mã OTP xác thực',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email đã được cập nhật',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email đã được cập nhật. Vui lòng kiểm tra email mới để xác thực',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email đã tồn tại hoặc mã OTP không hợp lệ',
  })
  async updateEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmailDto,
  ): Promise<{ message: string }> {
    return this.usersService.updateEmail(user.id, dto);
  }

  /**
   * Request OTP for account deletion
   * POST /users/me/request-deletion-otp
   */
  @Post('me/request-deletion-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu mã OTP để xóa tài khoản',
    description: 'Gửi mã OTP đến email để xác thực việc xóa tài khoản',
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
  async requestAccountDeletionOtp(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string; expiresAt: Date }> {
    console.log('[REQUEST_DELETION_OTP] User:', user.email, 'UserId:', user.id);
    return this.usersService.requestAccountDeletionOtp(user.id);
  }

  /**
   * Delete account with OTP
   * POST /users/me/delete
   */
  @Post('me/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa tài khoản với xác thực OTP',
    description: 'Xóa tài khoản người dùng với mã OTP xác thực',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tài khoản đã được xóa',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Tài khoản đã được xóa thành công',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mã OTP không hợp lệ hoặc đã hết hạn',
  })
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
  ): Promise<{ message: string }> {
    return this.usersService.deleteAccount(user.id, dto);
  }
}
