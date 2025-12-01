// src/modules/employers/employers.controller.ts

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
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
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../auth/services/jwt.service';
import {
  UpdateEmployerProfileDto,
  EmployerProfileResponseDto,
  AddLocationDto,
  EmployerLocationResponseDto,
} from './dto';

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
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.getProfileByUserId(user.sub);
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
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateEmployerProfileDto,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.updateProfile(user.sub, dto);
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
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddLocationDto,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.addLocation(user.sub, dto);
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
    @CurrentUser() user: JwtPayload,
  ): Promise<EmployerLocationResponseDto[]> {
    return this.employersService.getLocations(user.sub);
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
    @CurrentUser() user: JwtPayload,
    @Param('locationId') locationId: string,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.setHeadquarters(user.sub, locationId);
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
    @CurrentUser() user: JwtPayload,
    @Param('locationId') locationId: string,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.deleteLocation(user.sub, locationId);
  }

  /**
   * Get employer profile by ID (public)
   * GET /employers/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ nhà tuyển dụng theo ID',
    description: 'Lấy thông tin công khai của nhà tuyển dụng',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của nhà tuyển dụng',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: EmployerProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy nhà tuyển dụng',
  })
  async getProfileById(
    @Param('id') id: string,
  ): Promise<EmployerProfileResponseDto> {
    return this.employersService.getProfileById(id);
  }
}
