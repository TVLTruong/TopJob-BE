// src/modules/companies/companies.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { Public } from '../../common/decorators/public.decorator';
import { SearchCompaniesDto } from './dto/search-companies.dto';
import { IdParamDto } from '../../common/dto/id-param.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * PUBLIC API - Tìm kiếm công ty công khai
   * UC-GUEST-04: Tìm kiếm công ty
   * GET /api/companies
   *
   * Features:
   * - Không yêu cầu authentication (Guest có thể truy cập)
   * - Chỉ trả về employers có status = ACTIVE
   * - Tìm kiếm theo company name
   * - Filter: city, industry (search in description), company size
   * - Pagination: page, limit
   * - Response chuẩn REST với items, total, page, limit
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tìm kiếm công ty công khai (Public)',
    description:
      'API cho Guest/Candidate tìm kiếm công ty. Chỉ trả về employers ACTIVE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách công ty với pagination',
  })
  findAllPublic(@Query() dto: SearchCompaniesDto) {
    return this.companiesService.findAllPublic(dto);
  }

  /**
   * PUBLIC API - Lấy danh sách công ty nổi bật (top by job count)
   * GET /api/companies/featured
   *
   * Features:
   * - Không yêu cầu authentication
   * - Chỉ trả về employers có status = ACTIVE
   * - Sắp xếp theo số lượng jobs ACTIVE
   * - Giới hạn 6 công ty
   */
  @Public()
  @Get('featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách công ty nổi bật (Public)',
    description:
      'API để lấy top 6 công ty có nhiều việc làm nhất. Dùng cho trang chủ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách công ty nổi bật',
  })
  getFeaturedCompanies() {
    return this.companiesService.getFeaturedCompanies(6);
  }

  /**
   * PUBLIC API - Xem hồ sơ công ty
   * UC-GUEST-03: Xem hồ sơ công ty
   * GET /api/companies/:id
   *
   * Features:
   * - Không yêu cầu authentication (Guest có thể truy cập)
   * - Chỉ trả về employers có status = ACTIVE
   * - Load đầy đủ thông tin công ty và danh sách office locations
   * - Xử lý rõ ràng các trường hợp: NOT_FOUND, PENDING_APPROVAL, BANNED
   *
   * @param id - Employer ID
   * @returns Company profile với locations
   *
   * Error Responses:
   * - 404: Company không tồn tại
   * - 404: Company đang chờ phê duyệt
   * - 404: Company đã bị khóa
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xem hồ sơ công ty (Public)',
    description:
      'API cho Guest/Candidate xem chi tiết công ty và danh sách office locations. Chỉ trả về employers ACTIVE.',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết công ty với danh sách locations',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '1' },
        companyName: { type: 'string', example: 'Tech Innovation Co., Ltd' },
        description: {
          type: 'string',
          example: 'Leading technology company...',
        },
        website: { type: 'string', example: 'https://techinnovation.com' },
        logoUrl: { type: 'string', example: 'https://storage.../logo.png' },
        coverImageUrl: {
          type: 'string',
          example: 'https://storage.../cover.jpg',
        },
        foundedDate: { type: 'number', example: 2015 },
        companySize: { type: 'string', example: 'medium' },
        contactEmail: { type: 'string', example: 'hr@techinnovation.com' },
        contactPhone: { type: 'string', example: '0901234567' },
        benefits: { type: 'array', items: { type: 'string' } },
        locations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              province: { type: 'string', example: 'Hồ Chí Minh' },
              district: { type: 'string', example: 'Quận 1' },
              detailedAddress: { type: 'string' },
              isHeadquarters: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy công ty hoặc công ty chưa được duyệt',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          examples: [
            'Không tìm thấy công ty với ID: 123',
            'Hồ sơ công ty này đang chờ phê duyệt.',
            'Hồ sơ công ty này đã bị khóa.',
          ],
        },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  findOnePublic(@Param() param: IdParamDto) {
    return this.companiesService.findOnePublic(param.id);
  }
}
