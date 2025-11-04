import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from './entities/candidate.entity';
import { CreateCandidateDto } from './dto/create-candidate.dto'; // (Sẽ dùng cho Auth)
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate) // Tiêm (Inject) repository của Candidate
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  /**
   * (Hàm này dùng cho API GET /me)
   * Tìm hồ sơ candidate bằng USER ID (lấy từ token)
   */
  async findOneByUserId(userId: number) {
    // Tìm bằng quan hệ (relation)
    const profile = await this.candidateRepo.findOne({
      where: { user: { id: userId } },
      // relations: ['user'], // Bỏ comment nếu muốn trả về cả thông tin user
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }
    return profile;
  }

  /**
   * (Hàm này dùng cho API PATCH /me)
   * Cập nhật hồ sơ bằng USER ID (lấy từ token)
   */
  async update(userId: number, dto: UpdateCandidateDto) {
    // 1. Tìm hồ sơ bằng user ID
    const profile = await this.findOneByUserId(userId);

    // 2. Cập nhật các trường (nó sẽ tự bỏ qua các trường 'undefined')
    Object.assign(profile, dto);

    // 3. Lưu lại
    return this.candidateRepo.save(profile);
  }

  /**
   * ‼️ HÀM QUAN TRỌNG (ĐỂ CHO AUTH MODULE GỌI) ‼️
   * (Hàm này dùng nội bộ, không có API)
   *
   * Khi user đăng ký (trong AuthModule), nó sẽ gọi hàm này
   * để tạo một hồ sơ candidate trống.
   */
  async create(dto: CreateCandidateDto) {
    const candidateProfile = this.candidateRepo.create({
      user: dto.user,
      fullName: dto.fullName,
    });
    return this.candidateRepo.save(candidateProfile);
  }
}