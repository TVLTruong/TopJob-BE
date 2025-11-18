// src/modules/jobs/jobs.controller.ts
import {
  Controller,
  Get,
  Query, // 👈 (Dùng để nhận DTO 'search')
  Param, // 👈 (Dùng để nhận 'slug')
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Public } from '../../common/decorators/public.decorator'; // 👈 (Dùng 'tool' chung)
import { SearchJobsDto } from './dto/search-jobs.dto';
import { SlugParamDto } from '../../common/dto/slug-param.dto'; // (Dùng 'tool' chung)

@Controller('jobs') // Route gốc: /api/jobs
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * (API Dịch từ UC-GUEST-01: Tìm kiếm việc làm )
   * GET /api/jobs
   */
  @Public() // 👈 (Mở "cổng" này cho Guest)
  @Get()
  @HttpCode(HttpStatus.OK)
  findAllPublic(@Query() dto: SearchJobsDto) {
    return this.jobsService.findAllPublic(dto);
  }

  /**
   * (API Dịch từ UC-GUEST-02: Xem chi tiết việc làm )
   * GET /api/jobs/:slug
   */
  @Public() // 👈 (Mở "cổng" này cho Guest)
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  findOnePublicBySlug(@Param() param: SlugParamDto) { // (Dùng DTO 'slug' chung)
    return this.jobsService.findOnePublicBySlug(param.slug);
  }

  // (Các API 'POST', 'PATCH' (Cụm 4) của Employer/Admin sẽ được thêm sau)
}