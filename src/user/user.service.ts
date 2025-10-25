import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

// DTO: Định nghĩa dữ liệu cần để tạo User
export class CreateUserDto {
  // id sẽ được database tự tạo, không cần ở đây
  email: string;
  fullName: string;
  password: string; // <-- THÊM MỚI: Nhận mật khẩu (đã được hash)
  role: 'CANDIDATE' | 'RECRUITER';
  avatarUrl?: string; // Tùy chọn
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // SỬA LỖI 1: Đổi 'undefined' thành 'null'
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  // SỬA LỖI 2: Đổi 'undefined' thành 'null'
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  // Hàm tạo user mới (không đổi)
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }
}
