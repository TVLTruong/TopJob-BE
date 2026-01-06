// src/modules/jobs/jobs.controller.ts
import {
  Controller,
  Get,
  Param, // 👈 (Dùng để nhận 'slug')
  Query, // 👈 (Dùng để nhận DTO 'search')
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { Public } from '../../common/decorators/public.decorator'; // 👈 (Dùng 'tool' chung)
import { Job } from '../../database/entities/job.entity';
// import { SearchJobsDto } from './dto/search-jobs.dto';
import { PublicSearchJobsDto } from './dto/public-search-jobs.dto';
import { JobIdentifierDto } from './dto/job-identifier.dto';
// import { SlugParamDto } from '../../common/dto/slug-param.dto'; // (Dùng 'tool' chung)

@ApiTags('Jobs')
@Controller('jobs') // Route gốc: /api/jobs
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * PUBLIC API - Tìm kiếm việc làm công khai
   * UC-GUEST-01: Tìm kiếm việc làm
   * GET /api/jobs
   *
   * Features:
   * - Không yêu cầu authentication (Guest có thể truy cập)
   * - Chỉ trả về jobs ACTIVE và chưa hết hạn
   * - Tìm kiếm theo keyword (title, description)
   * - Filter: location, jobType, experienceLevel, salaryMin, salaryMax
   * - Sort: newest (mới nhất), relevant (liên quan nhất)
   * - Pagination: page, limit
   * - Response chuẩn REST với items, total, page, limit
   */
  @Public() // 👈 Cho phép Guest truy cập không cần authentication
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tìm kiếm việc làm công khai (Public)',
    description:
      'API cho Guest/Candidate tìm kiếm và filter việc làm. Chỉ trả về jobs ACTIVE và chưa hết hạn.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách việc làm với pagination',
  })
  findAllPublic(@Query() dto: PublicSearchJobsDto) {
    return this.jobsService.findAllPublic(dto);
  }

  /**
   * PUBLIC API - Xem chi tiết việc làm
   * UC-GUEST-02: Xem chi tiết việc làm
   * GET /api/jobs/:identifier
   *
   * Features:
   * - Không yêu cầu authentication (Guest có thể truy cập)
   * - Hỗ trợ tìm kiếm bằng ID (số) hoặc Slug (string)
   * - Chỉ trả về jobs có status = ACTIVE
   * - Load đầy đủ employer profile, location, category
   * - Tự động tăng view count
   * - Xử lý rõ ràng các trường hợp: EXPIRED, CLOSED, REMOVED, NOT_FOUND
   *
   * @param identifier - Job ID (vd: "123") hoặc Job Slug (vd: "senior-fullstack-developer")
   * @returns Job detail với đầy đủ thông tin
   *
   * Error Responses:
   * - 404: Job không tồn tại
   * - 404: Job đã hết hạn
   * - 404: Job đã đóng/bị gỡ/không được duyệt
   */
  @Public() // 👈 Cho phép Guest truy cập không cần authentication
  @Get(':identifier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xem chi tiết việc làm (Public)',
    description:
      'API cho Guest/Candidate xem chi tiết việc làm. Hỗ trợ tìm bằng ID hoặc Slug. Chỉ trả về jobs ACTIVE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết việc làm',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy việc làm hoặc việc làm đã hết hạn/bị gỡ',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          examples: [
            'Không tìm thấy việc làm với slug: senior-fullstack-developer',
            'Tin tuyển dụng này đã hết hạn. Vui lòng tìm việc làm khác.',
            'Tin tuyển dụng này đã đóng. Công ty đã tuyển đủ người.',
            'Tin tuyển dụng này đã bị gỡ bởi quản trị viên.',
          ],
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOnePublic(@Param() param: JobIdentifierDto) {
    return this.jobsService.findOnePublicByIdentifier(param.identifier);
  }

  /**
   * PUBLIC API - Lấy danh sách công việc đang tuyển của employer
   * GET /api/jobs/employer/:employerId/active
   * Features:
   * - Không yêu cầu authentication (Guest có thể xem)
   * - Chỉ trả về jobs ACTIVE và chưa hết hạn
   * - Sắp xếp theo expiredAt (deadline sớm nhất trước)
   * - Giới hạn 4 jobs (phù hợp cho company profile page)
   * @param employerId - ID của employer
   * @returns Danh sách tối đa 4 jobs
   */
  @Public()
  @Get('employer/:employerId/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy công việc đang tuyển của công ty (Public)',
    description:
      'Trả về tối đa 4 công việc ACTIVE, chưa hết hạn, sắp xếp theo deadline sớm nhất. Dùng cho company profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách công việc',
    type: [Job],
  })
  async findActiveJobsByEmployer(
    @Param('employerId') employerId: string,
  ): Promise<Job[]> {
    return await this.jobsService.findActiveJobsByEmployer(employerId, 4);
  }

  // (Các API 'POST', 'PATCH' (Cụm 4) của Employer/Admin sẽ được thêm sau)
}
