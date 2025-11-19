// src/modules/companies/companies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Employer } from '../../database/entities/employer.entity'; // 👈 Nối dây (Bảng 3)
import { Job } from '../../database/entities/job.entity'; // 👈 Nối dây (Bảng 8)
import { EmployerStatus, JobStatus } from '../../common/enums'; // 👈 Nối dây (Tool)
import { SearchCompaniesDto } from './dto/search-companies.dto';
import { createPaginationResponse } from '../../common/utils/query-builder.util';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Employer)
    private readonly employerRepo: Repository<Employer>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  /**
   * (Dịch từ UC-GUEST-04: Tìm kiếm Công ty )
   * Lấy danh sách công ty CÔNG KHAI (Public)
   */
  async findAllPublic(
    dto: SearchCompaniesDto,
  ): Promise<PaginationResponseDto<Employer>> {
    // 1. Tạo QueryBuilder (công cụ truy vấn động)
    const queryBuilder = this.employerRepo.createQueryBuilder('employer');

    // 2. Chỉ lấy công ty "ACTIVE" (Dịch từ UC-GUEST-04, Bước 5 [cite: 272])
    queryBuilder.where('employer.status = :status', {
      status: EmployerStatus.ACTIVE,
    });

    // 3. Lọc theo Tên công ty (q) (Dịch từ Bước 3 )
    if (dto.q) {
      queryBuilder.andWhere('employer.companyName ILIKE :q', {
        q: `%${dto.q}%`,
      });
    }

    // 4. Lọc theo Tỉnh/Thành (location) (Dịch từ Bước 3 )
    if (dto.location) {
      // (Cần JOIN với Bảng 4 'employer_locations')
      queryBuilder.innerJoin(
        'employer.locations',
        'location',
        'location.province = :location', // (Giả sử 'location' là Tên Tỉnh/Thành)
        { location: dto.location },
      );
    }
    
    // (Bạn có thể thêm lọc theo 'industry' (Ngành nghề) ở đây)
    // (Cần JOIN với Bảng 6 'employer_industries')

    // 5. Nối dây (JOIN) để lấy địa chỉ (locations) [cite: 247]
    queryBuilder.leftJoinAndSelect('employer.locations', 'locations');

    // 6. Sắp xếp (ví dụ: theo tên)
    queryBuilder.orderBy('employer.companyName', 'ASC');

    // 7. Phân trang (Dịch từ Bước 6 )
    return createPaginationResponse(
      queryBuilder,
      dto.page,
      dto.limit,
    );
  }

  /**
   * (Dịch từ UC-GUEST-03: Xem hồ sơ công ty )
   * Lấy 1 hồ sơ công ty CÔNG KHAI bằng ID (hoặc Slug)
   */
  async findOnePublic(id: string): Promise<any> {
    // 1. Truy xuất thông tin Cty (Dịch từ Bước 3 [cite: 247])
    const employer = await this.employerRepo.findOne({
      where: {
        id: id,
        status: EmployerStatus.ACTIVE, // (Dịch từ E1 [cite: 254-256])
      },
      relations: [
        'locations', // (Lấy danh sách địa điểm [cite: 247])
        // (Bạn có thể JOIN 'industries' (Bảng 6) ở đây)
      ],
    });

    if (!employer) {
      // (Dịch từ E1 [cite: 254-256])
      throw new NotFoundException('Hồ sơ công ty này không tồn tại.');
    }

    // 2. Truy xuất các tin tuyển dụng đang hoạt động (Dịch từ Bước 4 [cite: 248])
    const activeJobs = await this.jobRepo.find({
      where: {
        employerId: employer.id,
        status: JobStatus.ACTIVE, // Chỉ lấy tin ACTIVE
        deadline: MoreThan(new Date()), // Và còn hạn
      },
      order: { isUrgent: 'DESC', publishedAt: 'DESC' }, // Sắp xếp
      take: 20, // (Giới hạn 20 tin)
    });

    // 3. Trả về "Hợp đồng" (contract) cho Frontend
    return {
      ...employer, // (Toàn bộ thông tin Cty)
      jobs: activeJobs, // (Danh sách job đang tuyển)
    };
  }
}