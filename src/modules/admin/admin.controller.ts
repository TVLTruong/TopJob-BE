// src/modules/admin/admin.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Lấy thống kê dashboard',
    description: 'Lấy tất cả thống kê cho dashboard admin',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thống kê thành công',
    type: DashboardStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (chỉ ADMIN)',
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }
}
