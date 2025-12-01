// src/modules/users/users.controller.ts

import {
  Controller,
  Get,
  Put,
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
import { UserResponseDto, UpdatePasswordDto } from './dto';

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
}
