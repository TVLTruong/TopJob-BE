import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger, // 👈 Thêm Logger để debug
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // 👈 Thêm
import { Repository } from 'typeorm'; // 👈 Thêm
import { UsersService } from '../users/users.service';
import { CandidatesService } from '../candidates/candidates.service';
import { EmployersService } from '../employers/employers.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserRole } from '../../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt'; // 👈 Dùng để so sánh mật khẩu

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name); // 👈 Thêm Logger

  constructor(
    // Tiêm (Inject) các service liên quan
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

    // 2. Tạo User (AuthService sẽ gọi UsersService)
    // (Hàm 'create' của UsersService đã được chúng ta cập nhật)
    const newUser = await this.usersService.create(dto, dto.role);

    // 3. 🚀 Logic Rẽ Nhánh (Tạo hồ sơ tương ứng)
    try {
      if (dto.role === UserRole.CANDIDATE) {
        // 3a. Nếu là Candidate, tạo hồ sơ Candidate
        this.logger.log(`Creating candidate profile for user ${newUser.id}`);
        await this.candidatesService.create({
          user: newUser,
          fullName: dto.fullName,
        });
      } else if (dto.role === UserRole.EMPLOYER) {
        // 3b. Nếu là Employer, tạo hồ sơ Employer
        this.logger.log(`Creating employer profile for user ${newUser.id}`);
        await this.employersService.create({
          user: newUser,
          fullName: dto.fullName,
          companyName: dto.companyName, // (DTO đã validate)
        });
      }
    } catch (error) {
      // ‼️ ROLLBACK (Rất quan trọng)
      // Nếu bước 3 lỗi (ví dụ: tạo profile lỗi),
      // chúng ta phải xóa 'user' đã tạo ở bước 2
      this.logger.error(
        `Profile creation failed. Rolling back user ${newUser.id}`,
        error.stack,
      );
      await this.usersService.remove(newUser.id); // 👈 Rollback
      throw new BadRequestException('Failed to create profile', error.message);
    }

    // 4. (Tùy chọn) Gửi email xác thực ở đây...
    // Ví dụ: await this.sendVerificationEmail(newUser);
    
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
      throw new UnauthorizedException('Invalid credentials'); // Không báo 'User not found'
    }

    // 2. So sánh mật khẩu
    // ‼️ Cài đặt bcrypt: pnpm add bcrypt @types/bcrypt
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials'); // Không báo 'Wrong password'
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        throw new UnauthorizedException('Account is pending verification');
      }
      if (user.status === 'banned') {
        throw new UnauthorizedException('Account has been banned');
      }
    }
    
    // (Bạn có thể thêm check 'isVerified' ở đây nếu muốn)
    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Please verify your email first');
    // }

    // 4. Cập nhật last_login_at (không bắt buộc)
    // (Chúng ta có thể làm việc này sau)

    // 5. Tạo Payload và Token
    const payload: RequestUser = { // Dùng interface ta đã sửa
      sub: user.id, // 👈 'sub' là number (ID của user)
      email: user.email,
      role: user.role,
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}