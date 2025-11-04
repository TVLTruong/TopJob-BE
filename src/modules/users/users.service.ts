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
   * (AuthService sẽ gọi hàm này)
   * Tạo user mới với mật khẩu đã hash
   */
  async create(dto: CreateUserDto, role: UserRole) { // 👈 1. Nhận thêm 'role'
    const hash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash: hash, // 👈 2. Sửa thành 'passwordHash'
      role: role,         // 👈 3. Dùng 'role' động
      // Các trường 'status', 'is_verified' sẽ dùng default từ Entity
    });

    return this.userRepo.save(user);
  }

  findAll() {
    return this.userRepo.find();
  }

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
    return this.userRepo.findOne({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    // Logic cập nhật mật khẩu (đã sửa cho đúng)
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10); // 👈 4. Sửa 'passwordHash'
      delete dto.password; // Xóa password khỏi DTO
    }

    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.userRepo.remove(user);
  }
}