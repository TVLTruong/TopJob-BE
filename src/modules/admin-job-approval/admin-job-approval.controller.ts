// src/modules/admin-job-approval/admin-job-approval.controller.ts

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
import { AdminJobApprovalService } from './admin-job-approval.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { QueryJobDto, JobDetailDto, ApproveJobDto, RejectJobDto } from './dto';

/**
 * Admin Job Approval Controller
 * Handles job post approval workflow
 *
 * All endpoints require ADMIN role
 */
@ApiTags('Admin - Job Approval')
@ApiBearerAuth()
@Controller('admin/job-approval')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminJobApprovalController {
  constructor(private readonly approvalService: AdminJobApprovalService) {}

  /**
   * Get list of jobs pending approval
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tin tuyển dụng chờ duyệt',
    description:
      'Lấy danh sách các tin tuyển dụng có trạng thái PENDING_APPROVAL',
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
  async getJobList(@Query() queryDto: QueryJobDto) {
    return this.approvalService.getJobList(queryDto);
  }

  /**
   * Get detailed job information for review
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết tin tuyển dụng cần duyệt',
    description: 'Xem chi tiết thông tin tin tuyển dụng để xem xét phê duyệt',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tin tuyển dụng',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
    type: JobDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tin tuyển dụng',
  })
  async getJobDetail(@Param() { id }: IdParamDto): Promise<JobDetailDto> {
    return this.approvalService.getJobDetail(id);
  }

  /**
   * Approve a job post
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Duyệt tin tuyển dụng',
    description:
      'Duyệt tin tuyển dụng. Tin sẽ chuyển sang trạng thái ACTIVE và hiển thị cho ứng viên.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tin tuyển dụng',
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
    description: 'Không tìm thấy tin tuyển dụng',
  })
  async approveJob(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: ApproveJobDto,
  ) {
    return this.approvalService.approveJob(id, adminId, dto);
  }

  /**
   * Reject a job post
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Từ chối tin tuyển dụng',
    description:
      'Từ chối tin tuyển dụng. Tin sẽ chuyển sang trạng thái REJECTED. Bắt buộc cung cấp lý do.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tin tuyển dụng',
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
    description: 'Không tìm thấy tin tuyển dụng',
  })
  async rejectJob(
    @Param() { id }: IdParamDto,
    @CurrentUser('id') adminId: string,
    @Body() dto: RejectJobDto,
  ) {
    return this.approvalService.rejectJob(id, adminId, dto);
  }
}
