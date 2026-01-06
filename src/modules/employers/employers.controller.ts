// src/modules/employers/employers.controller.ts

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
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
import { EmployersService } from './employers.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles, Public } from '../../common/decorators';
import { UserRole } from '../../common/enums';
// import type { JwtPayload } from '../auth/services/jwt.service';
import type { AuthenticatedUser } from '../../common/types/express';
import {
  UpdateEmployerProfileDto,
  EmployerProfileResponseDto,
  AddLocationDto,
  EmployerLocationResponseDto,
  ApplicationDetailResponseDto,
  ApplicationAction,
  UpdateApplicationStatusResponseDto,
  GetApplicationsQueryDto,
  ApplicationListItemDto,
} from './dto';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';

/**
 * Employers Controller
 * Handles employer profile management endpoints
 * UC-EMP-01: Hoàn thiện hồ sơ nhà tuyển dụng
 * UC-EMP-02: Cập nhật thông tin công ty
 */
@ApiTags('Employers')
@Controller('employers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  /**
   * Get current user's employer profile
   * GET /employers/me
   */
  @Get('me')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ nhà tuyển dụng của tôi',
    description: 'Lấy thông tin hồ sơ nhà tuyển dụng của user đang đăng nhập',
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
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.getProfileByUserId(user.id);
  }

  /**
   * Update current user's employer profile (Next Step)
   * PUT /employers/me
   */
  @Put('me')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Cập nhật hồ sơ nhà tuyển dụng',
    description:
      'Cập nhật thông tin hồ sơ nhà tuyển dụng (UC-EMP-01: Hoàn thiện hồ sơ sau đăng ký)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
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
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.updateProfile(user.id, dto);
  }

  /**
   * Add new location
   * POST /employers/me/locations
   */
  @Post('me/locations')
  @Roles(UserRole.EMPLOYER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Thêm địa điểm văn phòng mới',
    description: 'Thêm địa điểm văn phòng/chi nhánh mới cho công ty',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thêm địa điểm thành công',
    type: EmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Đã đạt giới hạn số lượng địa điểm hoặc dữ liệu không hợp lệ',
  })
  async addLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddLocationDto,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.addLocation(user.id, dto);
  }

  /**
   * Get all locations
   * GET /employers/me/locations
   */
  @Get('me/locations')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Lấy danh sách địa điểm',
    description: 'Lấy tất cả địa điểm văn phòng của công ty',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: [EmployerLocationResponseDto],
  })
  async getMyLocations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EmployerLocationResponseDto[]> {
    return this.employersService.getLocations(user.id);
  }

  /**
   * Set headquarters
   * PUT /employers/me/locations/:locationId/headquarters
   */
  @Put('me/locations/:locationId/headquarters')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Đặt trụ sở chính',
    description: 'Chọn địa điểm làm trụ sở chính',
  })
  @ApiParam({
    name: 'locationId',
    description: 'ID của địa điểm',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đặt trụ sở chính thành công',
    type: EmployerProfileResponseDto,
  })
  async setHeadquarters(
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.setHeadquarters(user.id, locationId);
  }

  /**
   * Delete location
   * DELETE /employers/me/locations/:locationId
   */
  @Delete('me/locations/:locationId')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Xóa địa điểm',
    description: 'Xóa một địa điểm khỏi danh sách',
  })
  @ApiParam({
    name: 'locationId',
    description: 'ID của địa điểm cần xóa',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa địa điểm thành công',
    type: EmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy địa điểm',
  })
  async deleteLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('locationId') locationId: string,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.deleteLocation(user.id, locationId);
  }

  /**
   * Get all applications for employer's jobs
   * GET /employer/applications
   */
  @Get('applications')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Lấy danh sách đơn ứng tuyển',
    description:
      'Lấy tất cả đơn ứng tuyển cho các job của employer hiện tại. Hỗ trợ filter theo jobId, status, thời gian, và search theo tên ứng viên.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách đơn ứng tuyển',
    type: ApplicationListItemDto,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'jobId không thuộc employer hiện tại',
  })
  async getAllApplications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetApplicationsQueryDto,
  ): Promise<PaginationResponseDto<ApplicationListItemDto>> {
    return await this.employersService.getAllApplications(user.id, query);
  }

  /**
   * Get application details by application ID
   * GET /employer/applications/:applicationId
   */
  @Get('applications/:applicationId')
  @Roles(UserRole.EMPLOYER)
  @ApiOperation({
    summary: 'Lấy chi tiết đơn ứng tuyển',
    description:
      'Lấy chi tiết đơn ứng tuyển (chỉ xem được đơn thuộc job của mình). Khi xem, trạng thái NEW sẽ tự động chuyển thành VIEWED.',
  })
  @ApiParam({
    name: 'applicationId',
    description: 'ID của đơn ứng tuyển',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: ApplicationDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn ứng tuyển hoặc không có quyền truy cập',
  })
  async getApplicationDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationDetailResponseDto> {
    return this.employersService.getApplicationDetail(user.id, applicationId);
  }

  /**
   * Update application status (shortlist or reject)
   * PATCH /employer/applications/:id/{action}
   */
  @Patch('applications/:id/:action')
  @Roles(UserRole.EMPLOYER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật trạng thái đơn ứng tuyển',
    description:
      'Shortlist/reject/hire đơn ứng tuyển.\n' +
      '- NEW/VIEWED → shortlist/reject\n' +
      '- SHORTLISTED → hire/reject\n' +
      'Reject có thể từ bất kỳ trạng thái nào (new/viewed/shortlisted)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của đơn ứng tuyển',
  })
  @ApiParam({
    name: 'action',
    description: 'Hành động: shortlist, reject hoặc hire',
    enum: ['shortlist', 'reject', 'hire'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: UpdateApplicationStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Trạng thái đơn ứng tuyển không hợp lệ để thực hiện hành động này',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn ứng tuyển hoặc không có quyền truy cập',
  })
  async updateApplicationStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') applicationId: string,
    @Param('action') action: ApplicationAction,
  ): Promise<UpdateApplicationStatusResponseDto> {
    return this.employersService.updateApplicationStatus(
      user.id,
      applicationId,
      action,
    );
  }

  // Public employer profile lookup - must come after all specific routes
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get thông tin hồ sơ công khai của nhà tuyển dụng' })
  @ApiParam({
    name: 'id',
    description: 'ID của nhà tuyển dụng',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin hồ sơ thành công',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy nhà tuyển dụng',
  })
  async getProfileById(@Param('id') id: string): Promise<any> {
    return this.employersService.getProfileById(id);
  }
}
