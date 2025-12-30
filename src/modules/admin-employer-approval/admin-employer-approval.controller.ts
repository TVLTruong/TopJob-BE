// src/modules/admin-employer-approval/admin-employer-approval.controller.ts

import {
  Controller,
  Get,
  Post,
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
import { AdminEmployerApprovalService } from './admin-employer-approval.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { IdParamDto } from '../../common/dto/id-param.dto';
import {
  QueryEmployerDto,
  EmployerDetailDto,
  ApproveEmployerDto,
  RejectEmployerDto,
} from './dto';

/**
 * Admin Employer Approval Controller
 * Handles employer profile approval workflow
 *
 * All endpoints require ADMIN role
 */
@ApiTags('Admin - Employer Approval')
@ApiBearerAuth()
@Controller('admin/employer-approval')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminEmployerApprovalController {
  constructor(private readonly approvalService: AdminEmployerApprovalService) {}

  /**
   * Get list of employers pending approval
   * Includes both new profiles and pending edits
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách nhà tuyển dụng chờ duyệt',
    description:
      'Hỗ trợ 3 chế độ: duyệt mới (NEW), duyệt chỉnh sửa (EDIT), hoặc tất cả (ALL)',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền ADMIN' })
  async getEmployerList(@Query() queryDto: QueryEmployerDto) {
    return this.approvalService.getEmployerList(queryDto);
  }

  /**
   * Get detailed employer information for review
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết NTD cần duyệt',
    description:
      'Xem chi tiết thông tin user, hồ sơ employer, và các chỉnh sửa đang chờ duyệt (nếu có)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của employer',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: EmployerDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy employer',
  })
  async getEmployerDetail(
    @Param() { id }: IdParamDto,
  ): Promise<EmployerDetailDto> {
    return this.approvalService.getEmployerDetail(id);
  }

  /**
   * Approve employer profile or pending edits
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Duyệt hồ sơ NTD',
    description:
      'Duyệt hồ sơ mới hoặc chỉnh sửa hồ sơ của nhà tuyển dụng. ' +
      'Hồ sơ mới: user.status = ACTIVE. ' +
      'Chỉnh sửa: apply dữ liệu từ pending edits, xóa bản ghi pending.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của employer',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Duyệt thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Trạng thái không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy employer',
  })
  async approveEmployer(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: ApproveEmployerDto,
  ) {
    return this.approvalService.approveEmployer(id, adminId, dto);
  }

  /**
   * Reject employer profile or pending edits
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Từ chối hồ sơ NTD',
    description:
      'Từ chối hồ sơ mới hoặc chỉnh sửa hồ sơ của nhà tuyển dụng. ' +
      'Hồ sơ mới: user.status = PENDING_PROFILE_COMPLETION. ' +
      'Chỉnh sửa: xóa pending edits, giữ hồ sơ cũ. ' +
      'Bắt buộc cung cấp lý do.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của employer',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Từ chối thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Trạng thái không hợp lệ hoặc thiếu lý do',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy employer',
  })
  async rejectEmployer(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: RejectEmployerDto,
  ) {
    return this.approvalService.rejectEmployer(id, adminId, dto);
  }
}
