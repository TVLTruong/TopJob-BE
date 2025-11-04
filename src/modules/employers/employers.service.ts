import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employer } from './entities/employer.entity';
import { UpdateEmployerDto } from './dto/update-employer.dto';
import { CreateEmployerDto } from './dto/create-employer.dto';

@Injectable()
export class EmployersService {
  constructor(
    @InjectRepository(Employer) // Tiêm (Inject) repository của Employer
    private readonly employerRepo: Repository<Employer>,
  ) {}

  /**
   * (Dùng cho API GET /me)
   * Tìm hồ sơ employer bằng USER ID (lấy từ token)
   */
  async findOneByUserId(userId: number) {
    const profile = await this.employerRepo.findOne({
      where: { user: { id: userId } },
      relations: ['locations'], // 👈 Tải kèm danh sách văn phòng
    });

    if (!profile) {
      throw new NotFoundException('Employer profile not found');
    }
    return profile;
  }

  /**
   * (Dùng cho API PATCH /me)
   * Cập nhật hồ sơ bằng USER ID (lấy từ token)
   */
  async update(userId: number, dto: UpdateEmployerDto) {
    // 1. Tìm hồ sơ bằng user ID
    const profile = await this.findOneByUserId(userId);

    // 2. Cập nhật các trường
    Object.assign(profile, dto);

    // 3. Lưu lại
    return this.employerRepo.save(profile);
  }
// --- 🚀 HÀM MỚI (AuthService gọi) ---
  async create(dto: CreateEmployerDto) {
    const profile = this.employerRepo.create({
      user: dto.user,
      fullName: dto.fullName,
      companyName: dto.companyName,
    });
    return this.employerRepo.save(profile);
  }
  // (Lưu ý: hàm 'create' cho employer sẽ phức tạp hơn
  // và được gọi bởi AuthModule, chúng ta sẽ làm sau)
}