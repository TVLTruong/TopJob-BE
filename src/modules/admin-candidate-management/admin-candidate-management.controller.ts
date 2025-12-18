// src/modules/admin-candidate-management/admin-candidate-management.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
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
  ApiParam,
} from '@nestjs/swagger';
import { AdminCandidateManagementService } from './admin-candidate-management.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { IdParamDto } from '../../common/dto/id-param.dto';
import {
  QueryCandidateDto,
  CandidateDetailResponseDto,
  BanCandidateDto,
  UpdateCandidateDto,
} from './dto';

/**
 * Admin Candidate Management Controller
 * Handles candidate account management operations
 *
 * All endpoints require ADMIN role
 */
@ApiTags('Admin - Candidate Management')
@ApiBearerAuth()
@Controller('admin/candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCandidateManagementController {
  constructor(
    private readonly managementService: AdminCandidateManagementService,
  ) {}

  /**
   * Get list of candidates
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách ứng viên',
    description:
      'Lấy danh sách tất cả users có role = CANDIDATE với pagination và filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (chỉ ADMIN)',
  })
  async getCandidateList(@Query() queryDto: QueryCandidateDto) {
    return this.managementService.getCandidateList(queryDto);
  }

  /**
   * Get candidate detail
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết ứng viên',
    description:
      'Xem chi tiết thông tin user, profile và thống kê applications',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (candidate)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: CandidateDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ứng viên',
  })
  async getCandidateDetail(
    @Param() { id }: IdParamDto,
  ): Promise<CandidateDetailResponseDto> {
    return this.managementService.getCandidateDetail(id);
  }

  /**
   * Ban candidate account
   */
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cấm tài khoản ứng viên',
    description: 'Cấm tài khoản ứng viên. User status = BANNED.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (candidate)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Cấm thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Trạng thái không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không thể tự cấm chính mình',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ứng viên',
  })
  async banCandidate(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: BanCandidateDto,
  ) {
    return this.managementService.banCandidate(id, adminId, dto);
  }

  /**
   * Unban candidate account
   */
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mở cấm tài khoản ứng viên',
    description: 'Mở cấm tài khoản ứng viên. User status = ACTIVE.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (candidate)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Mở cấm thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Trạng thái không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ứng viên',
  })
  async unbanCandidate(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.managementService.unbanCandidate(id, adminId);
  }

  /**
   * Update candidate basic information
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin cơ bản ứng viên',
    description:
      'Admin cập nhật thông tin cơ bản: fullName, phoneNumber, avatarUrl. Không cho phép sửa các field hệ thống.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (candidate)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ứng viên',
  })
  async updateCandidate(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.managementService.updateCandidate(id, dto);
  }

  /**
   * Delete candidate account
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa tài khoản ứng viên',
    description:
      'Xóa tài khoản ứng viên. Không cho phép nếu có applications (trừ khi force delete).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (candidate)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa do có applications',
  })
  @ApiResponse({
    status: 403,
    description: 'Không thể tự xóa chính mình',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy ứng viên',
  })
  async deleteCandidate(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.managementService.deleteCandidate(id, adminId);
  }
}
