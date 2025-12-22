// src/modules/employers/employer-profile.controller.ts

import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmployersService } from './employers.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../auth/services/jwt.service';
import {
  EmployerProfileResponseDto,
  SubmitEmployerProfileResponseDto,
  UpdateEmployerProfileDto,
} from './dto';
import { LogoutUseCase } from '../auth/usecases';

/**
 * Employer Profile Controller
 * Endpoint: GET /employer/profile/me
 * Restrict to Employer role and enforce ownership via current user
 */
@ApiTags('Employers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employer/profile')
export class EmployerProfileController {
  constructor(
    private readonly employersService: EmployersService,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  /**
   * Get current employer profile (ownership: userId = current user)
   * GET /employer/profile/me
   */
  @Get('me')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Lấy hồ sơ nhà tuyển dụng của tôi',
    description: 'Chỉ dành cho EMPLOYER, lấy hồ sơ + danh sách địa điểm',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: EmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ nhà tuyển dụng',
  })
  async getMyEmployerProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.getProfileByUserId(user.sub);
  }

  /**
   * Submit employer profile for approval (requires pending_profile_completion)
   * POST /employer/profile/submit
   * After submit, client should logout (token invalidate)
   */
  @Post('submit')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Gửi hồ sơ nhà tuyển dụng',
    description:
      'Chỉ dành cho EMPLOYER ở trạng thái chờ hoàn thiện hồ sơ. Sau khi gửi sẽ yêu cầu logout.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gửi hồ sơ thành công, trả về profile hiện tại',
    type: SubmitEmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Thiếu logo, thiếu địa điểm, trạng thái không hợp lệ hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ nhà tuyển dụng',
  })
  async submitEmployerProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEmployerProfileDto,
  ): Promise<SubmitEmployerProfileResponseDto> {
    const profile = await this.employersService.submitProfile(user.sub, dto);

    // Server-side logout hook (stateless JWT: client must drop token)
    const logoutResult = await this.logoutUseCase.execute(user.sub);

    return {
      profile,
      message: logoutResult.message,
      shouldLogout: true,
      redirectUrl: logoutResult.redirectUrl ?? '/auth/login',
    };
  }

  /**
   * Update employer profile (auto-approve, ownership enforced)
   * PUT /employer/profile
   */
  @Put()
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Cập nhật hồ sơ nhà tuyển dụng (auto approve)',
    description:
      'Chỉ cập nhật field không nhạy cảm, đồng bộ locations (CRUD), tự động duyệt.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công, trả về hồ sơ hiện tại',
    type: EmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ nhà tuyển dụng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  async updateEmployerProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.updateProfileAutoApprove(user.sub, dto);
  }

  /**
   * Submit sensitive changes for admin approval (no public change)
   * PUT /employer/profile/sensitive
   */
  @Put('sensitive')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Gửi thay đổi nhạy cảm (chờ admin duyệt)',
    description:
      'Lưu bản nháp thay đổi nhạy cảm (vd: companyName, logoUrl) vào pending edits, set profileStatus = pending_edit_approval.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Đã ghi nhận thay đổi nhạy cảm, hồ sơ public giữ nguyên, chờ admin duyệt',
    type: EmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ nhà tuyển dụng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Không có thay đổi nhạy cảm hoặc dữ liệu không hợp lệ',
  })
  async submitSensitiveChanges(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.submitSensitiveEdit(user.sub, dto);
  }
}
