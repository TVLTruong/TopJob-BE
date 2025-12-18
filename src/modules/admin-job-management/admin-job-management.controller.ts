// src/modules/admin-job-management/admin-job-management.controller.ts

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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { AdminJobManagementService } from './admin-job-management.service';
import { QueryJobDto, JobDetailDto, RemoveJobDto } from './dto';

/**
 * Admin Job Management Controller
 * REST API for managing job posts as admin
 *
 * Protected routes:
 * - JwtAuthGuard: Requires valid JWT token
 * - RolesGuard: Requires ADMIN role
 * - Employers CANNOT access these endpoints
 */
@ApiTags('Admin - Job Management')
@ApiBearerAuth()
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminJobManagementController {
  constructor(
    private readonly adminJobManagementService: AdminJobManagementService,
  ) {}

  /**
   * Get paginated list of all jobs
   * Admin can view jobs with any status: ACTIVE, PENDING, REJECTED, etc.
   */
  @Get()
  @ApiOperation({
    summary: 'Xem danh sách tất cả job posts',
    description:
      'Admin xem tất cả jobs với bộ lọc trạng thái (ACTIVE, PENDING_APPROVAL, REJECTED). Hỗ trợ tìm kiếm và phân trang.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách jobs với pagination',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async getJobList(@Query() query: QueryJobDto) {
    return this.adminJobManagementService.getJobList(query);
  }

  /**
   * Get detailed job information by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết job post',
    description:
      'Xem đầy đủ thông tin job bao gồm employer, category, location, và thống kê',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết job',
    type: JobDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  async getJobDetail(@Param() params: IdParamDto): Promise<JobDetailDto> {
    return this.adminJobManagementService.getJobDetail(params.id);
  }

  /**
   * Force remove job by admin
   * Changes status to REMOVED_BY_ADMIN, hides job from candidates
   */
  @Post(':id/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gỡ job post bởi admin',
    description:
      'Force remove job (thường là ACTIVE). Job sẽ có status = REMOVED_BY_ADMIN và bị ẩn khỏi candidate. Phù hợp xử lý vi phạm.',
  })
  @ApiParam({
    name: 'id',
    description: 'Job ID cần gỡ',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Job đã được gỡ thành công',
  })
  @ApiResponse({ status: 400, description: 'Job đã bị gỡ trước đó' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy job' })
  async removeJob(
    @Param() params: IdParamDto,
    @Body() dto: RemoveJobDto,
    @CurrentUser('id') adminId: string,
  ) {
    await this.adminJobManagementService.removeJob(params.id, adminId, dto);
    return {
      message: 'Job đã được gỡ bởi admin thành công',
      jobId: params.id,
      status: 'REMOVED_BY_ADMIN',
    };
  }
}
