// src/modules/companies/companies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employer } from '../../database/entities/employer.entity'; // 👈 Nối dây (Bảng 3)
import { Job } from '../../database/entities/job.entity'; // 👈 Nối dây (Bảng 8)
import { EmployerStatus } from '../../common/enums'; // 👈 Nối dây (Tool)
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
   * PUBLIC API - Tìm kiếm công ty công khai cho Guest/Candidate
   * UC-GUEST-04: Tìm kiếm công ty
   *
   * Features:
   * - Chỉ trả về employers có status = ACTIVE
   * - Tìm kiếm theo company name
   * - Filter theo city (location), industry, company size
   * - Pagination: page, limit
   * - Query tối ưu với QueryBuilder
   * - Response chuẩn REST (items, total, page, limit)
   *
   * @param dto - Search filters và pagination
   * @returns Paginated list of employers
   */
  async findAllPublic(
    dto: SearchCompaniesDto,
  ): Promise<PaginationResponseDto<Employer>> {
    // 1. Khởi tạo QueryBuilder với relations cần thiết
    const queryBuilder = this.employerRepo
      .createQueryBuilder('employer')
      .leftJoinAndSelect('employer.locations', 'locations');

    // 2. Filter cơ bản: Chỉ lấy ACTIVE employers
    queryBuilder.where('employer.status = :status', {
      status: EmployerStatus.ACTIVE,
    });

    // 3. Tìm kiếm theo company name
    if (dto.keyword && dto.keyword.trim()) {
      queryBuilder.andWhere('employer.companyName ILIKE :keyword', {
        keyword: `%${dto.keyword.trim()}%`,
      });
    }

    // 4. Filter theo city/province
    // Tìm employers có ít nhất 1 location ở city được chỉ định
    if (dto.city && dto.city.trim()) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM employer_locations el WHERE el.employer_id = employer.id AND el.province ILIKE :city)',
        { city: `%${dto.city.trim()}%` },
      );
    }

    // 5. Filter theo company size
    if (dto.companySize) {
      queryBuilder.andWhere('employer.companySize = :companySize', {
        companySize: dto.companySize,
      });
    }

    // 6. Filter theo industry (nếu có field trong DB)
    // Note: Hiện tại employer entity không có industry field
    // Nếu cần, phải thêm relation với CompanyCategory hoặc thêm industry field
    if (dto.industry && dto.industry.trim()) {
      // Placeholder: Có thể search trong description
      queryBuilder.andWhere('employer.description ILIKE :industry', {
        industry: `%${dto.industry.trim()}%`,
      });
    }

    // 7. Sorting: Sắp xếp theo tên công ty
    queryBuilder.orderBy('employer.companyName', 'ASC');

    // 8. Pagination và trả về kết quả
    return createPaginationResponse(queryBuilder, dto.page, dto.limit);
  }

  /**
   * PUBLIC API - Xem hồ sơ công ty công khai
   * UC-GUEST-03: Xem hồ sơ công ty
   *
   * Features:
   * - Chỉ cho phép xem employers có status = ACTIVE
   * - Load đầy đủ thông tin công ty và locations
   * - Xử lý rõ ràng các trường hợp: NOT_FOUND, PENDING_APPROVAL, BANNED
   * - Trả về thông tin công ty và danh sách office locations
   *
   * @param id - Employer ID
   * @returns Employer profile với locations
   * @throws NotFoundException - Company không tồn tại hoặc chưa được duyệt
   */
  async findOnePublic(id: string): Promise<any> {
    // 1. Tìm employer (không filter status để xử lý message cụ thể)
    const employer = await this.employerRepo.findOne({
      where: { id },
      relations: ['locations'],
    });

    // 2. Employer không tồn tại
    if (!employer) {
      throw new NotFoundException(`Không tìm thấy công ty với ID: ${id}`);
    }

    // 3. Kiểm tra status - chỉ cho phép ACTIVE
    if (employer.status !== EmployerStatus.ACTIVE) {
      // Xử lý các trường hợp cụ thể
      if (employer.status === EmployerStatus.PENDING_APPROVAL) {
        throw new NotFoundException('Hồ sơ công ty này đang chờ phê duyệt.');
      }

      if (employer.status === EmployerStatus.BANNED) {
        throw new NotFoundException('Hồ sơ công ty này đã bị khóa.');
      }

      // Các status khác
      throw new NotFoundException('Hồ sơ công ty này không khả dụng.');
    }

    // 4. Trả về thông tin công ty với locations
    return {
      id: employer.id,
      companyName: employer.companyName,
      description: employer.description,
      website: employer.website,
      logoUrl: employer.logoUrl,
      // coverImageUrl: employer.coverImageUrl,
      foundedDate: employer.foundedDate,
      // companySize: employer.companySize,
      contactEmail: employer.contactEmail,
      contactPhone: employer.contactPhone,
      linkedlnUrl: employer.linkedlnUrl,
      facebookUrl: employer.facebookUrl,
      xUrl: employer.xUrl,
      benefits: employer.benefits,
      locations: employer.locations,
      createdAt: employer.createdAt,
      updatedAt: employer.updatedAt,
    };
  }
}
