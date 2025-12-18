// src/modules/candidates/candidates.controller.ts

import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import type { JwtPayload } from '../auth/services/jwt.service';
import { Job, Application } from '../../database/entities';
import {
  UpdateCandidateProfileDto,
  CandidateProfileResponseDto,
  UploadCvDto,
  // SetDefaultCvDto,
  UploadAvatarResponseDto,
  SetDefaultCvResponseDto,
  DeleteCvResponseDto,
  ToggleSavedJobResponseDto,
  ApplyJobDto,
  ApplyJobResponseDto,
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
   * Throws 404 if profile not found
   */
  @Get('me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ ứng viên của tôi',
    description: 'Lấy thông tin hồ sơ ứng viên của user đang đăng nhập.',
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
   * Upload avatar
   * POST /candidates/me/avatar
   */
  @Post('me/avatar')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload ảnh đại diện',
    description: 'Upload ảnh đại diện cho ứng viên',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload thành công',
    type: UploadAvatarResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'File không hợp lệ hoặc quá lớn',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ ứng viên',
  })
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    return this.candidatesService.uploadAvatar(user.sub, file);
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

  // /**
  //  * Set default CV
  //  * PUT /candidates/me/cvs/default
  //  */
  // @Put('me/cvs/default')
  // @Roles(UserRole.CANDIDATE)
  // @ApiOperation({
  //   summary: 'Đặt CV mặc định',
  //   description: 'Chọn CV để sử dụng khi ứng tuyển',
  // })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Đặt CV mặc định thành công',
  //   type: CandidateProfileResponseDto,
  // })
  // async setDefaultCv(
  //   @CurrentUser() user: JwtPayload,
  //   @Body() dto: SetDefaultCvDto,
  // ): Promise<CandidateProfileResponseDto> {
  //   return this.candidatesService.setDefaultCv(user.sub, dto.cvId);
  // }

  /**
   * Set default CV (alternative endpoint)
   * PATCH /candidates/me/cvs/:cvId/default
   */
  @Patch('me/cvs/:cvId/default')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Đặt CV mặc định (theo ID)',
    description:
      'Chọn CV để sử dụng khi ứng tuyển bằng cách truyền ID trong URL',
  })
  @ApiParam({
    name: 'cvId',
    description: 'ID của CV cần đặt làm mặc định',
    example: '123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đặt CV mặc định thành công',
    type: SetDefaultCvResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy CV hoặc CV không thuộc về ứng viên',
  })
  async setDefaultCvById(
    @CurrentUser() user: JwtPayload,
    @Param('cvId') cvId: string,
  ): Promise<SetDefaultCvResponseDto> {
    return this.candidatesService.setDefaultCvWithMessage(user.sub, cvId);
  }

  /**
   * Delete CV
   * DELETE /candidates/me/cvs/:cvId
   */
  @Delete('me/cvs/:cvId')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Xóa CV',
    description: 'Xóa một CV khỏi hồ sơ và xóa file trên cloud storage',
  })
  @ApiParam({
    name: 'cvId',
    description: 'ID của CV cần xóa',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa CV thành công',
    type: DeleteCvResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy CV',
  })
  async deleteCv(
    @CurrentUser() user: JwtPayload,
    @Param('cvId') cvId: string,
  ): Promise<DeleteCvResponseDto> {
    return this.candidatesService.deleteCvWithMessage(user.sub, cvId);
  }

  /**
   * Get saved jobs
   * GET /candidates/me/saved-jobs
   */
  @Get('me/saved-jobs')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Lấy danh sách công việc đã lưu',
    description: 'Lấy tất cả công việc mà ứng viên đã lưu',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: [Job],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ ứng viên',
  })
  async getSavedJobs(@CurrentUser() user: JwtPayload): Promise<Job[]> {
    return this.candidatesService.getSavedJobs(user.sub);
  }

  /**
   * Toggle saved job
   * POST /candidates/me/saved-jobs/:jobId
   */
  @Post('me/saved-jobs/:jobId')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lưu/bỏ lưu công việc',
    description:
      'Toggle trạng thái lưu công việc. Nếu chưa lưu -> tạo mới. Nếu đã lưu -> xóa.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'ID của công việc',
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: ToggleSavedJobResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy công việc hoặc hồ sơ ứng viên',
  })
  async toggleSavedJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
  ): Promise<ToggleSavedJobResponseDto> {
    return this.candidatesService.toggleSavedJob(user.sub, jobId);
  }

  /**
   * Apply to a job
   * POST /jobs/:jobId/apply
   */
  @Post('/jobs/:jobId/apply')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ứng tuyển công việc',
    description:
      'Nộp đơn ứng tuyển vào một công việc. Nếu không chỉ định CV sẽ dùng CV mặc định.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'ID của công việc cần ứng tuyển',
    example: '1',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ứng tuyển thành công',
    type: ApplyJobResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Không có CV, đã ứng tuyển rồi, hoặc công việc không còn nhận ứng tuyển',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy công việc hoặc hồ sơ ứng viên',
  })
  async applyJob(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: ApplyJobDto,
  ): Promise<ApplyJobResponseDto> {
    return this.candidatesService.applyJob(user.sub, jobId, dto);
  }

  /**
   * Get applications
   * GET /candidates/me/applications
   */
  @Get('me/applications')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Lấy danh sách đơn ứng tuyển',
    description: 'Lấy tất cả đơn ứng tuyển của ứng viên',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thành công',
    type: [Application],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hồ sơ ứng viên',
  })
  async getApplications(
    @CurrentUser() user: JwtPayload,
  ): Promise<Application[]> {
    return this.candidatesService.getApplications(user.sub);
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
  ): Promise<CandidateProfileResponseDto | Record<string, never>> {
    return this.candidatesService.getProfileByUserIdOrEmpty(id);
  }
}
