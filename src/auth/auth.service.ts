import {
  Injectable,
  ConflictException, // Lỗi 409 (Trùng lặp)
  UnauthorizedException, // Lỗi 401 (Không có quyền)
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt'; // Import bcrypt để mã hóa
import { JwtService } from '@nestjs/jwt'; // Import JWT để tạo token
import { LoginDto } from './dto/login.dto'; // Import DTO đăng nhập

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService, // Tiêm Service của User
    private readonly jwtService: JwtService, // Tiêm Service của JWT
  ) {}

  /**
   * Xử lý Đăng ký
   */
  // THAY ĐỔI 1: Cập nhật kiểu trả về của hàm
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, password, fullName } = registerDto;

    // 1. Kiểm tra email
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Tạo user
    const newUser = await this.userService.create({
      email,
      password: hashedPassword,
      fullName,
      role: 'CANDIDATE',
    });

    // SỬA LỖI: Tạo một đối tượng trả về (result) theo cách thủ công
    // Cách này không tạo ra biến "unused" (không dùng) nào cả.
    const result = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    return result; // Trả về đối tượng 'result' (không có password)
  }

  /**
   * Xử lý Đăng nhập
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    // 1. Tìm user bằng email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Không nên nói rõ "Không tìm thấy user" -> bảo mật
      throw new UnauthorizedException('Email hoặc mật khẩu không hợp lệ');
    }

    // 2. So sánh mật khẩu người dùng gõ với mật khẩu đã hash trong DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không hợp lệ');
    }

    // 3. Tạo Token (JWT)
    // Payload là thông tin bạn muốn lưu vào token
    const payload = {
      sub: user.id, // Subject (luôn dùng ID của user)
      email: user.email,
      role: user.role,
    };

    // Ký token và trả về
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
