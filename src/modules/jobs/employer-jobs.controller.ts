// src/modules/jobs/employer-jobs.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
// import type { JwtPayload } from '../auth/services/jwt.service';
import type { AuthenticatedUser } from '../../common/types/express';
import { CreateJobDto, CreateJobResponseDto, UpdateJobDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { Job } from '../../database/entities/job.entity';
import { Application } from '../../database/entities/application.entity';

@ApiTags('Employer Jobs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
@Controller('employer/jobs')
export class EmployerJobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * GET /employer/jobs
   * Lấy danh sách tin tuyển dụng của employer hiện tại
   */
  @Get()
  @ApiOperation({
    summary: 'Danh sách tin tuyển dụng của tôi',
    description: 'Chỉ trả về job thuộc employer hiện tại, có phân trang',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách tin',
    type: PaginationResponseDto<Job>,
  })
  async getEmployerJobs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponseDto<Job>> {
    return this.jobsService.getJobsForEmployer(user.id, pagination);
  }

  /**
   * GET /employer/jobs/:jobId
   * Lấy chi tiết tin tuyển dụng (chỉ của employer hiện tại)
   */
  @Get(':jobId')
  @ApiOperation({
    summary: 'Chi tiết tin tuyển dụng của tôi',
    description: 'Lấy đầy đủ thông tin job với employer ownership check',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chi tiết tin tuyển dụng',
    type: Job,
  })
  async getJobDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<Job> {
    return this.jobsService.getJobDetailForEmployer(user.id, jobId);
  }

  /**
   * POST /employer/jobs
   * Tạo job mới
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo tin tuyển dụng mới',
    description: 'Sinh tin tuyển dụng với trạng thái pending_approval',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tạo thành công',
    type: CreateJobResponseDto,
  })
  createJob(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateJobDto,
  ): Promise<CreateJobResponseDto> {
    return this.jobsService.createJobForEmployer(user.id, dto);
  }

  /**
   * PUT /employer/jobs/:jobId
   * Cập nhật job, đảm bảo ownership
   */
  @Put(':jobId')
  @ApiOperation({
    summary: 'Cập nhật tin tuyển dụng',
    description:
      'Chỉ chủ job được sửa. Nếu thay đổi nội dung chính → chuyển trạng thái pending_approval.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: CreateJobResponseDto,
  })
  async updateJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
  ): Promise<CreateJobResponseDto> {
    return this.jobsService.updateJobForEmployer(user.id, jobId, dto);
  }

  /**
   * PATCH /employer/jobs/:jobId/hide
   * Ẩn job (chỉ khi đang ACTIVE), đảm bảo ownership
   */
  @Patch(':jobId/hide')
  @ApiOperation({
    summary: 'Ẩn tin tuyển dụng',
    description: 'Chỉ owner, chỉ khi job đang ACTIVE.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ẩn thành công',
    type: CreateJobResponseDto,
  })
  async hideJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<CreateJobResponseDto> {
    return this.jobsService.hideJobForEmployer(user.id, jobId);
  }

  /**
   * PATCH /employer/jobs/:jobId/unhide
   * Hủy ẩn job (chuyển từ HIDDEN về ACTIVE)
   */
  @Patch(':jobId/unhide')
  @ApiOperation({
    summary: 'Hủy ẩn tin tuyển dụng',
    description: 'Chỉ owner, chỉ khi job đang HIDDEN.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hủy ẩn thành công',
    type: CreateJobResponseDto,
  })
  async unhideJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<CreateJobResponseDto> {
    return this.jobsService.unhideJobForEmployer(user.id, jobId);
  }

  /**
   * PATCH /employer/jobs/:jobId/close
   * Kết thúc job (chuyển status sang CLOSED)
   */
  @Patch(':jobId/close')
  @ApiOperation({
    summary: 'Kết thúc tin tuyển dụng',
    description: 'Chỉ owner, chuyển status sang CLOSED.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kết thúc thành công',
    type: CreateJobResponseDto,
  })
  async closeJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<CreateJobResponseDto> {
    return this.jobsService.closeJobForEmployer(user.id, jobId);
  }

  /**
   * GET /employer/jobs/:jobId/applications
   * Lấy danh sách ứng tuyển của job (ownership enforced)
   */
  @Get(':jobId/applications')
  @ApiOperation({
    summary: 'Danh sách ứng tuyển của job',
    description:
      'Chỉ trả application thuộc job của employer hiện tại, sort appliedAt desc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách ứng tuyển',
    type: PaginationResponseDto<Application>,
  })
  async getJobApplications(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginationResponseDto<Application>> {
    return this.jobsService.getApplicationsForEmployerJob(
      user.id,
      jobId,
      pagination,
    );
  }

  /**
   * DELETE /employer/jobs/:jobId
   * Xóa job (soft delete - chuyển status về REMOVED_BY_ADMIN)
   */
  @Delete(':jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa tin tuyển dụng',
    description:
      'Soft delete - chuyển status về REMOVED_BY_ADMIN. Chỉ owner được xóa.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa thành công',
    type: CreateJobResponseDto,
  })
  async deleteJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param('jobId') jobId: string,
  ): Promise<CreateJobResponseDto> {
    return this.jobsService.deleteJobForEmployer(user.id, jobId);
  }
}
