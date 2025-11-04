import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CandidatesService } from '../candidates/candidates.service';
import { EmployersService } from '../employers/employers.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    // Tiêm (Inject) 4 "công cụ"
    private readonly usersService: UsersService,
    private readonly candidatesService: CandidatesService,
    private readonly employersService: EmployersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 🚀 LOGIC ĐĂNG KÝ
   */
  async register(dto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${dto.email}`);

    // 1. Kiểm tra User tồn tại
    const userExists = await this.usersService.findOneByEmail(dto.email);
    if (userExists) {
      this.logger.warn(`Registration failed: Email ${dto.email} already exists`);
      throw new BadRequestException('Email already exists');
    }

    // 2. Tạo User (AuthService gọi UsersService)
    const newUser = await this.usersService.create(dto, dto.role);

    // 3. 🚀 Logic Rẽ Nhánh (Tạo hồ sơ tương ứng)
    try {
      if (dto.role === UserRole.CANDIDATE) {
        // 3a. Tạo hồ sơ Candidate
        this.logger.log(`Creating candidate profile for user ${newUser.id}`);
        await this.candidatesService.create({
          user: newUser,
          fullName: dto.fullName,
        });
      } else if (dto.role === UserRole.EMPLOYER) {
        // 3b. Tạo hồ sơ Employer
        this.logger.log(`Creating employer profile for user ${newUser.id}`);
        await this.employersService.create({
          user: newUser,
          fullName: dto.fullName, // (full_name từ Bảng 3)
          companyName: dto.companyName, // (company_name từ Bảng 3)
        });
      }
    } catch (error) {
      // ‼️ ROLLBACK (Xóa user nếu tạo profile lỗi)
      this.logger.error(
        `Profile creation failed. Rolling back user ${newUser.id}`,
        error.stack,
      );
      await this.usersService.remove(newUser.id); // 👈 Rollback
      throw new BadRequestException('Failed to create profile', error.message);
    }

    // 4. (Tùy chọn) Gửi email xác thực (dùng Bảng 11) ở đây...
    
    this.logger.log(`User ${newUser.id} registered successfully`);
    return {
      message: 'Registration successful. Please check your email to verify.',
    };
  }

  /**
   * 🚀 LOGIC ĐĂNG NHẬP
   */
  async login(dto: LoginDto) {
    // 1. Tìm user bằng email
    const user = await this.usersService.findOneByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Kiểm tra trạng thái tài khoản (từ Bảng 1)
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        throw new UnauthorizedException('Account is pending verification/approval');
      }
      if (user.status === 'banned') {
        throw new UnauthorizedException('Account has been banned');
      }
    }
    
    // (Bạn có thể thêm check 'isVerified' ở đây nếu muốn)

    // 4. Cập nhật last_login_at (từ Bảng 1)
    user.lastLoginAt = new Date();
    await this.usersService.update(user.id, {}); // (Hàm update sẽ tự save)

    // 5. Tạo Payload và Token
    const payload: RequestUser = { // Dùng interface ta đã sửa (sub: number)
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}