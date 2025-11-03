import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'; // 👈 Bảo vệ
import { CurrentUser } from '../../common/decorators/current-user.decorator'; // 👈 Lấy user
import type { RequestUser } from '../../common/interfaces/request-user.interface'; // 👈 Kiểu dữ liệu user
import { UserRole } from '../../common/enums/user-role.enum'; // 👈 Enum Role

@Controller('candidates') // Route gốc: /api/candidates
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  // --- API LẤY HỒ SƠ CỦA CHÍNH TÔI ---
  // GET /api/candidates/me
  @UseGuards(JwtAuthGuard) // 1. Phải đăng nhập
  @Get('me')
  findMyProfile(@CurrentUser() user: RequestUser) {
    // 2. Kiểm tra có phải là Candidate không
    if (user.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can access this route');
    }
    // 3. Lấy hồ sơ bằng user ID (user.sub) từ token
    return this.candidatesService.findOneByUserId(user.sub);
  }

  // --- API CẬP NHẬT HỒ SƠ CỦA CHÍNH TÔI ---
  // PATCH /api/candidates/me
  @UseGuards(JwtAuthGuard) // 1. Phải đăng nhập
  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: RequestUser, // 2. Lấy user từ token
    @Body() dto: UpdateCandidateDto, // 3. Lấy dữ liệu từ body
  ) {
    if (user.role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidates can update this profile');
    }
    // 4. Cập nhật bằng user ID (user.sub)
    return this.candidatesService.update(user.sub, dto);
  }
}