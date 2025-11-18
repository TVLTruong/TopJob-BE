// src/modules/companies/companies.controller.ts
import {
  Controller,
  Get,
  Query, // 👈 (Dùng để nhận DTO 'search')
  Param, // 👈 (Dùng để nhận 'id')
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Public } from '../../common/decorators/public.decorator'; // (Dùng 'tool' chung)
import { SearchCompaniesDto } from './dto/search-companies.dto';
import { IdParamDto } from '../../common/dto/id-param.dto'; // (Dùng 'tool' chung)

@Controller('companies') // Route gốc: /api/companies
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * (API Dịch từ UC-GUEST-04: Tìm kiếm Công ty )
   * GET /api/companies
   */
  @Public() // 👈 (Mở "cổng" này cho Guest)
  @Get()
  @HttpCode(HttpStatus.OK)
  findAllPublic(@Query() dto: SearchCompaniesDto) {
    return this.companiesService.findAllPublic(dto);
  }

  /**
   * (API Dịch từ UC-GUEST-03: Xem hồ sơ công ty )
   * GET /api/companies/:id
   */
  @Public() // 👈 (Mở "cổng" này cho Guest)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOnePublic(@Param() param: IdParamDto) { // (Dùng DTO 'id' chung)
    return this.companiesService.findOnePublic(param.id);
  }
}