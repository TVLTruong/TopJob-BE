// src/modules/admin-employer-management/admin-employer-management.controller.ts

import {
  Controller,
  Get,
  Post,
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
import { AdminEmployerManagementService } from './admin-employer-management.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { IdParamDto } from '../../common/dto/id-param.dto';
import {
  QueryEmployerDto,
  EmployerDetailResponseDto,
  BanEmployerDto,
} from './dto';

/**
 * Admin Employer Management Controller
 * Handles employer account management operations
 *
 * All endpoints require ADMIN role
 */
@ApiTags('Admin - Employer Management')
@ApiBearerAuth()
@Controller('admin/employers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminEmployerManagementController {
  constructor(
    private readonly managementService: AdminEmployerManagementService,
  ) {}

  /**
   * Get list of employers
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách nhà tuyển dụng',
    description:
      'Lấy danh sách tất cả users có role = EMPLOYER với pagination và filter',
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
  async getEmployerList(@Query() queryDto: QueryEmployerDto) {
    return this.managementService.getEmployerList(queryDto);
  }

  /**
   * Get employer detail
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết nhà tuyển dụng',
    description: 'Xem chi tiết thông tin user, profile và thống kê jobs',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (employer)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: EmployerDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy nhà tuyển dụng',
  })
  async getEmployerDetail(
    @Param() { id }: IdParamDto,
  ): Promise<EmployerDetailResponseDto> {
    return this.managementService.getEmployerDetail(id);
  }

  /**
   * Ban employer account
   */
  @Post(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cấm tài khoản nhà tuyển dụng',
    description:
      'Cấm tài khoản nhà tuyển dụng. User status = BANNED, tất cả job posts bị ẩn.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (employer)',
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
    description: 'Không tìm thấy nhà tuyển dụng',
  })
  async banEmployer(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: BanEmployerDto,
  ) {
    return this.managementService.banEmployer(id, adminId, dto);
  }

  /**
   * Unban employer account
   */
  @Post(':id/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mở cấm tài khoản nhà tuyển dụng',
    description: 'Mở cấm tài khoản nhà tuyển dụng. User status = ACTIVE.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (employer)',
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
    description: 'Không tìm thấy nhà tuyển dụng',
  })
  async unbanEmployer(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.managementService.unbanEmployer(id, adminId);
  }

  /**
   * Delete employer account permanently
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa tài khoản nhà tuyển dụng',
    description:
      'Xóa vĩnh viễn tài khoản nhà tuyển dụng và toàn bộ dữ liệu liên quan (cascade).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của user (employer)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không thể tự xóa chính mình',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy nhà tuyển dụng',
  })
  async deleteEmployer(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.managementService.deleteEmployer(id, adminId);
  }
}
