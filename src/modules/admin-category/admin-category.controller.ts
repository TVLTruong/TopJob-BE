// src/modules/admin-category/admin-category.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { IdParamDto } from '../../common/dto/id-param.dto';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { JobCategory, EmployerCategory } from '../../database/entities';
import { AdminCategoryService } from './admin-category.service';
import {
  QueryCategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryType,
} from './dto';

/**
 * Admin Category Management Controller
 * REST API for managing shared categories (JobCategory, EmployerCategory)
 *
 * Protected routes:
 * - JwtAuthGuard: Requires valid JWT token
 * - RolesGuard: Requires ADMIN role
 */
@ApiTags('Admin - Category Management')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  /**
   * Get paginated list of categories
   * Supports filtering by type, active status, and search
   */
  @Get()
  @ApiOperation({
    summary: 'Xem danh sách categories',
    description:
      'Admin xem tất cả JobCategory hoặc EmployerCategory với bộ lọc. Hỗ trợ tìm kiếm và phân trang.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách categories với pagination',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async getCategoryList(
    @Query() query: QueryCategoryDto,
  ): Promise<PaginationResponseDto<JobCategory | EmployerCategory>> {
    return this.adminCategoryService.getCategoryList(query);
  }

  /**
   * Get detailed category information by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết category',
    description:
      'Xem đầy đủ thông tin category. Cần truyền type trong query parameter.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123',
  })
  @ApiQuery({
    name: 'type',
    description: 'Loại category',
    enum: CategoryType,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về thông tin chi tiết category',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy category' })
  async getCategoryDetail(
    @Param() params: IdParamDto,
    @Query('type') type: CategoryType,
  ): Promise<JobCategory | EmployerCategory> {
    return this.adminCategoryService.getCategoryDetail(params.id, type);
  }

  /**
   * Create new category
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo category mới',
    description:
      'Tạo JobCategory hoặc EmployerCategory. JobCategory hỗ trợ cấu trúc cây (parentId).',
  })
  @ApiResponse({
    status: 201,
    description: 'Category đã được tạo thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug đã tồn tại',
  })
  async createCategory(
    @Body() dto: CreateCategoryDto,
  ): Promise<{ message: string; category: JobCategory | EmployerCategory }> {
    const category = await this.adminCategoryService.createCategory(dto);
    return {
      message: 'Tạo category thành công',
      category,
    };
  }

  /**
   * Update category information
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật category',
    description:
      'Cập nhật name, slug, description. Type và parentId không thể thay đổi.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123',
  })
  @ApiQuery({
    name: 'type',
    description: 'Loại category',
    enum: CategoryType,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Category đã được cập nhật',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy category',
  })
  @ApiResponse({
    status: 409,
    description: 'Slug đã tồn tại',
  })
  async updateCategory(
    @Param() params: IdParamDto,
    @Query('type') type: CategoryType,
    @Body() dto: UpdateCategoryDto,
  ): Promise<{ message: string; category: JobCategory | EmployerCategory }> {
    const category = await this.adminCategoryService.updateCategory(
      params.id,
      type,
      dto,
    );
    return {
      message: 'Cập nhật category thành công',
      category,
    };
  }

  /**
   * Hide category (soft delete)
   */
  @Post(':id/hide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ẩn category',
    description:
      'Đặt isActive = false. Category bị ẩn khỏi dropdown nhưng không ảnh hưởng dữ liệu cũ.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123',
  })
  @ApiQuery({
    name: 'type',
    description: 'Loại category',
    enum: CategoryType,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Category đã được ẩn',
  })
  @ApiResponse({
    status: 400,
    description: 'Category đã bị ẩn trước đó',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy category',
  })
  async hideCategory(
    @Param() params: IdParamDto,
    @Query('type') type: CategoryType,
  ): Promise<{ message: string; categoryId: string; isActive: boolean }> {
    await this.adminCategoryService.hideCategory(params.id, type);
    return {
      message: 'Ẩn category thành công',
      categoryId: params.id,
      isActive: false,
    };
  }

  /**
   * Unhide category (restore)
   */
  @Post(':id/unhide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hiện lại category',
    description:
      'Đặt isActive = true. Category hiển thị lại trong dropdown frontend.',
  })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123',
  })
  @ApiQuery({
    name: 'type',
    description: 'Loại category',
    enum: CategoryType,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Category đã được hiện lại',
  })
  @ApiResponse({
    status: 400,
    description: 'Category đang hoạt động',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy category',
  })
  async unhideCategory(
    @Param() params: IdParamDto,
    @Query('type') type: CategoryType,
  ): Promise<{ message: string; categoryId: string; isActive: boolean }> {
    await this.adminCategoryService.unhideCategory(params.id, type);
    return {
      message: 'Hiện lại category thành công',
      categoryId: params.id,
      isActive: true,
    };
  }
}
