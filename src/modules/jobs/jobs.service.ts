// src/modules/jobs/jobs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,MoreThan } from 'typeorm';
import { Job } from '../../database/entities/job.entity'; // 👈 Nối dây (Lớp 1)
import { JobStatus } from '../../common/enums'; // 👈 Nối dây (Tool)
import { SearchJobsDto } from './dto/search-jobs.dto';
import { createPaginationResponse } from '../../common/utils/query-builder.util'; // (Dùng 'tool' chung)
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    // (Bạn có thể inject 'job.repository.ts' (custom) nếu cần)
  ) {}

  /**
   * (Dịch từ UC-GUEST-01: Tìm kiếm việc làm )
   * Lấy danh sách việc làm CÔNG KHAI (Public)
   */
  async findAllPublic(
    dto: SearchJobsDto,
  ): Promise<PaginationResponseDto<Job>> {
    // 1. Tạo QueryBuilder (công cụ truy vấn động)
    const queryBuilder = this.jobRepo.createQueryBuilder('job');

    // 2. Chỉ lấy tin "ACTIVE" (Dịch từ UC-GUEST-01, Bước 4 [cite: 190])
    queryBuilder
      .where('job.status = :status', { status: JobStatus.ACTIVE })
      .andWhere('job.deadline > :now', { now: new Date() }); // (Và "còn hạn")

    // 3. Lọc theo Từ khóa (q) (Dịch từ Bước 1 [cite: 187])
    if (dto.q) {
      queryBuilder.andWhere('job.title ILIKE :q', { q: `%${dto.q}%` });
    }

    // 4. Lọc theo Địa điểm (city) (Dịch từ Bước 2 [cite: 188])
    if (dto.city) {
      // (Cần JOIN với 'location' và 'city' entity)
      // queryBuilder.innerJoin('job.location', 'location');
      // queryBuilder.innerJoin('location.city', 'city', 'city.slug = :citySlug', { citySlug: dto.city });
    }
    
    // (Thêm các bộ lọc 'salaryMin', 'jobType', 'experienceLevel'... ở đây)
    // (Dịch từ A2 )

    // 5. Nối dây (JOIN) các "Bản thiết kế" (Entity) liên quan
    queryBuilder
      .leftJoinAndSelect('job.employer', 'employer') // (Lấy thông tin Công ty)
      .leftJoinAndSelect('job.location', 'location'); // (Lấy thông tin Địa điểm)

    // 6. Sắp xếp (Dịch từ A2 [cite: 201])
    if (dto.sort === 'newest') {
      queryBuilder.orderBy('job.publishedAt', 'DESC');
    } else {
      queryBuilder.orderBy('job.isUrgent', 'DESC'); // (Ưu tiên 'Gấp')
    }

    // 7. Phân trang (Dịch từ Bước 5 )
    return createPaginationResponse(
      queryBuilder,
      dto.page,
      dto.limit,
    );
  }

  /**
   * (Dịch từ UC-GUEST-02: Xem chi tiết việc làm )
   * Lấy 1 việc làm CÔNG KHAI bằng Slug
   */
  async findOnePublicBySlug(slug: string): Promise<Job> {
    const job = await this.jobRepo.findOne({
      where: {
        slug: slug, // (Dịch từ Bước 2 [cite: 218])
        status: JobStatus.ACTIVE, // (Dịch từ E1 [cite: 233])
        deadline: MoreThan(new Date()), // (Dịch từ E1 [cite: 233])
      },
      relations: [
        'employer', // (Dịch từ Bước 3: Thông tin công ty [cite: 219])
        'location', // (Dịch từ Bước 3: Địa điểm [cite: 219])
        'category', // (Dịch từ Bước 3: Cấp bậc [cite: 219])
      ],
    });

    if (!job) {
      // (Dịch từ E1 [cite: 232-234])
      throw new NotFoundException('Tin tuyển dụng này đã hết hạn hoặc không còn tồn tại.');
    }

    // (Tùy chọn: Tăng view_count ở đây)
    // job.viewCount++;
    // await this.jobRepo.save(job);

    return job;
  }
  
  // (Các hàm 'createJob', 'updateJob' (Cụm 4) sẽ được thêm sau)
}