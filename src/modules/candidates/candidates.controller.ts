// src/modules/candidates/candidates.controller.ts

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
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../auth/services/jwt.service';
import {
  UpdateCandidateProfileDto,
  CandidateProfileResponseDto,
  UploadCvDto,
  SetDefaultCvDto,
} from './dto';

/**
 * Candidates Controller
 * Handles candidate profile management endpoints
 * UC-CAN-01: Hoàn thiện hồ sơ ứng viên
 * UC-CAN-02: Upload CV
 */
@ApiTags('Candidates')
@Controller('candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  /**
   * Get current user's candidate profile
   * GET /candidates/me
   */
  @Get('me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ ứng viên của tôi',
    description: 'Lấy thông tin hồ sơ ứng viên của user đang đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: CandidateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ ứng viên',
  })
  async getMyProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<CandidateProfileResponseDto> {
    return this.candidatesService.getProfileByUserId(user.sub);
  }

  /**
   * Update current user's candidate profile (Next Step)
   * PUT /candidates/me
   */
  @Put('me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Cập nhật hồ sơ ứng viên',
    description:
      'Cập nhật thông tin hồ sơ ứng viên (UC-CAN-01: Hoàn thiện hồ sơ sau đăng ký)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: CandidateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ ứng viên',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfileResponseDto> {
    return this.candidatesService.updateProfile(user.sub, dto);
  }

  /**
   * Upload CV
   * POST /candidates/me/cvs
   */
  @Post('me/cvs')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Thêm CV mới',
    description:
      'Upload thông tin CV (sau khi đã upload file lên cloud storage)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thêm CV thành công',
    type: CandidateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Đã đạt giới hạn số lượng CV hoặc dữ liệu không hợp lệ',
  })
  async uploadCv(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UploadCvDto,
  ): Promise<CandidateProfileResponseDto> {
    return this.candidatesService.uploadCv(user.sub, dto);
  }

  /**
   * Get all CVs
   * GET /candidates/me/cvs
   */
  @Get('me/cvs')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Lấy danh sách CV',
    description: 'Lấy tất cả CV của ứng viên',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
  })
  async getMyCvs(@CurrentUser() user: JwtPayload) {
    return this.candidatesService.getCvs(user.sub);
  }

  /**
   * Set default CV
   * PUT /candidates/me/cvs/default
   */
  @Put('me/cvs/default')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Đặt CV mặc định',
    description: 'Chọn CV để sử dụng khi ứng tuyển',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đặt CV mặc định thành công',
    type: CandidateProfileResponseDto,
  })
  async setDefaultCv(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetDefaultCvDto,
  ): Promise<CandidateProfileResponseDto> {
    return this.candidatesService.setDefaultCv(user.sub, dto.cvId);
  }

  /**
   * Delete CV
   * DELETE /candidates/me/cvs/:cvId
   */
  @Delete('me/cvs/:cvId')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Xóa CV',
    description: 'Xóa một CV khỏi hồ sơ',
  })
  @ApiParam({
    name: 'cvId',
    description: 'ID của CV cần xóa',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa CV thành công',
    type: CandidateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy CV',
  })
  async deleteCv(
    @CurrentUser() user: JwtPayload,
    @Param('cvId') cvId: string,
  ): Promise<CandidateProfileResponseDto> {
    return this.candidatesService.deleteCv(user.sub, cvId);
  }

  /**
   * Get candidate profile by ID (public or admin)
   * GET /candidates/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ ứng viên theo ID',
    description: 'Lấy thông tin công khai của ứng viên',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của ứng viên',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: CandidateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy ứng viên',
  })
  async getProfileById(
    @Param('id') id: string,
  ): Promise<CandidateProfileResponseDto> {
    return this.candidatesService.getProfileById(id);
  }
}
