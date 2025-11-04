import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum'; // Import Enum

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * (Hàm này sẽ được AuthService gọi là chính)
   * Tạo user mới với mật khẩu đã hash
   */
  async create(dto: CreateUserDto, role: UserRole) { // 👈 1. Nhận thêm 'role'
    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash: hash, // 👈 2. Sửa thành 'passwordHash'
      role: role,         // 👈 3. Dùng 'role' động
      // Các trường 'status' (pending) và 'isVerified' (false)
      // sẽ tự động được gán bởi 'default' trong Entity.
    });

    return this.userRepo.save(user);
  }

  /**
   * Lấy tất cả user (Dùng cho Admin)
   */
  findAll() {
    return this.userRepo.find();
  }

  /**
   * Lấy 1 user bằng ID (Dùng cho Admin hoặc nội bộ)
   */
  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * (AuthService sẽ gọi hàm này)
   * Tìm user bằng email (để check đăng nhập / đăng ký)
   */
  async findOneByEmail(email: string) {
    // Không ném (throw) lỗi 404 ở đây,
    // để AuthService tự xử lý logic (ví dụ: 'Sai email hoặc mật khẩu')
    return this.userRepo.findOne({ where: { email } });
  }

  /**
   * Cập nhật user (Dùng cho Admin hoặc user tự cập nhật)
   */
  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id); // Check xem user có tồn tại không

    // Logic cập nhật mật khẩu (đã sửa cho đúng)
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10); // 👈 4. Sửa 'passwordHash'
      delete dto.password; // Xóa password khỏi DTO
    }

    // Logic cập nhật email
    if (dto.email && dto.email !== user.email) {
      // (Nếu đổi email, nên set 'isVerified' = false và gửi lại mail)
      user.isVerified = false;
      user.emailVerifiedAt = null;
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  /**
   * Xóa user (Dùng cho Admin)
   */
  async remove(id: number) {
    const user = await this.findOne(id);
    return this.userRepo.remove(user);
  }
}