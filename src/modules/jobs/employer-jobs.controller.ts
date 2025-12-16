// src/modules/jobs/employer-jobs.controller.ts

import {
    Body,
    Controller,
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../auth/services/jwt.service';
import {
    CreateJobDto,
    CreateJobResponseDto,
    UpdateJobDto,
} from './dto';
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
    constructor(private readonly jobsService: JobsService) { }

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
        @CurrentUser() user: JwtPayload,
        @Query() pagination: PaginationDto,
    ): Promise<PaginationResponseDto<Job>> {
        return this.jobsService.getJobsForEmployer(user.sub, pagination);
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
        @CurrentUser() user: JwtPayload,
        @Body() dto: CreateJobDto,
    ): Promise<CreateJobResponseDto> {
        return this.jobsService.createJobForEmployer(user.sub, dto);
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
        @CurrentUser() user: JwtPayload,
        @Param('jobId') jobId: string,
        @Body() dto: UpdateJobDto,
    ): Promise<CreateJobResponseDto> {
        return this.jobsService.updateJobForEmployer(user.sub, jobId, dto);
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
        @CurrentUser() user: JwtPayload,
        @Param('jobId') jobId: string,
    ): Promise<CreateJobResponseDto> {
        return this.jobsService.hideJobForEmployer(user.sub, jobId);
    }

    /**
     * GET /employer/jobs/:jobId/applications
     * Lấy danh sách ứng tuyển của job (ownership enforced)
     */
    @Get(':jobId/applications')
    @ApiOperation({
        summary: 'Danh sách ứng tuyển của job',
        description: 'Chỉ trả application thuộc job của employer hiện tại, sort appliedAt desc',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách ứng tuyển',
        type: PaginationResponseDto<Application>,
    })
    async getJobApplications(
        @CurrentUser() user: JwtPayload,
        @Param('jobId') jobId: string,
        @Query() pagination: PaginationDto,
    ): Promise<PaginationResponseDto<Application>> {
        return this.jobsService.getApplicationsForEmployerJob(
            user.sub,
            jobId,
            pagination,
        );
    }
}

