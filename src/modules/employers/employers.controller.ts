import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { EmployersService } from './employers.service';
import { UpdateEmployerDto } from './dto/update-employer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('employers') // Route gốc: /api/employers
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  // --- API LẤY HỒ SƠ CỦA CHÍNH TÔI ---
  // GET /api/employers/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyProfile(@CurrentUser() user: RequestUser) {
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can access this route');
    }
    return this.employersService.findOneByUserId(user.sub);
  }

  // --- API CẬP NHẬT HỒ SƠ CỦA CHÍNH TÔI ---
  // PATCH /api/employers/me
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateEmployerDto,
  ) {
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException('Only employers can update this profile');
    }
    return this.employersService.update(user.sub, dto);
  }
}