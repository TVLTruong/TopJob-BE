// src/modules/companies/companies.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  ): Promise<PaginationResponseDto<any>> {
    // Build the base WHERE conditions
    let whereConditions = 'employer.status = :status';
    const params: any = { status: EmployerStatus.ACTIVE };

    // 3. Tìm kiếm theo company name hoặc lĩnh vực
    if (dto.keyword && dto.keyword.trim()) {
      whereConditions +=
        ' AND (employer.companyName ILIKE :keyword OR EXISTS (SELECT 1 FROM employer_employer_categories eec INNER JOIN employer_categories ec ON eec.category_id = ec.id WHERE eec.employer_id = employer.id AND ec.name ILIKE :keyword))';
      params.keyword = `%${dto.keyword.trim()}%`;
    }

    // 4. Filter theo city/province - use subquery
    if (dto.city && dto.city.trim()) {
      whereConditions +=
        ' AND EXISTS (SELECT 1 FROM employer_locations el WHERE el.employer_id = employer.id AND el.province ILIKE :city)';
      params.city = `%${dto.city.trim()}%`;
    }

    // 6. Filter theo industry - use subquery
    if (dto.industry && dto.industry.trim()) {
      whereConditions +=
        ' AND EXISTS (SELECT 1 FROM employer_employer_categories eec INNER JOIN employer_categories ec ON eec.category_id = ec.id WHERE eec.employer_id = employer.id AND ec.name ILIKE :industry)';
      params.industry = `%${dto.industry.trim()}%`;
    }

    // 8. Pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    // Build main query for getting paginated employers
    const [employers, total] = await this.employerRepo
      .createQueryBuilder('employer')
      .where(whereConditions, params)
      .orderBy('employer.companyName', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Load relations for the selected employers
    const employerIds = employers.map((e) => e.id);
    if (employerIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const employersWithRelations = await this.employerRepo
      .createQueryBuilder('employer')
      .leftJoinAndSelect('employer.locations', 'locations')
      .leftJoinAndSelect('employer.employerCategories', 'employerCategories')
      .leftJoinAndSelect('employerCategories.category', 'category')
      .whereInIds(employerIds)
      .orderBy('employer.companyName', 'ASC')
      .getMany();

    // 9. Transform data để có format giống getFeaturedCompanies
    const transformedData = employersWithRelations.map((employer) => {
      // Get unique provinces from locations
      const uniqueLocations = Array.from(
        new Set(
          employer.locations?.map((loc) => loc.province).filter(Boolean) || [],
        ),
      );

      // Get category names - ensure we get strings
      const categories = employer.employerCategories
        ?.map((ec) => {
          if (ec.category && typeof ec.category.name === 'string') {
            return ec.category.name;
          }
          return null;
        })
        .filter((name): name is string => name !== null) || [];

      return {
        id: employer.id,
        companyName: employer.companyName,
        logoUrl: employer.logoUrl,
        categories,
        locations: uniqueLocations,
        jobCount: 0, // Will be updated if needed
      };
    });

    // 10. Return paginated response
    return {
      data: transformedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * PUBLIC API - Lấy danh sách công ty nổi bật
   * Sắp xếp theo số lượng jobs ACTIVE
   *
   * @param limit - Số lượng công ty tối đa (mặc định 6)
   * @returns Danh sách employers với job count
   */
  async getFeaturedCompanies(limit: number = 6): Promise<any[]> {
    // Bước 1: Lấy danh sách employer IDs với job count
    const employerJobCounts = await this.employerRepo
      .createQueryBuilder('employer')
      .leftJoin(
        'employer.jobs',
        'job',
        'job.status = :jobStatus AND job.expiredAt > :now',
        {
          jobStatus: 'active',
          now: new Date(),
        },
      )
      .where('employer.status = :employerStatus', {
        employerStatus: EmployerStatus.ACTIVE,
      })
      .select('employer.id', 'employerId')
      .addSelect('employer.companyName', 'companyName')
      .addSelect('COUNT(job.id)', 'jobCount')
      .groupBy('employer.id')
      .addGroupBy('employer.companyName')
      .orderBy('COUNT(job.id)', 'DESC')
      .addOrderBy('employer.companyName', 'ASC')
      .limit(limit)
      .getRawMany();

    // Nếu không có employer nào, trả về mảng rỗng
    if (employerJobCounts.length === 0) {
      return [];
    }

    // Bước 2: Lấy thông tin đầy đủ của các employers
    const employerIds = employerJobCounts.map((e) => e.employerId);
    const employers = await this.employerRepo.find({
      where: {
        id: In(employerIds) as any,
      },
      relations: ['locations', 'employerCategories', 'employerCategories.category'],
    });

    // Bước 3: Tạo map jobCount theo employerId
    const jobCountMap = new Map(
      employerJobCounts.map((e) => [
        e.employerId,
        parseInt(e.jobCount || '0', 10),
      ]),
    );

    // Bước 4: Transform và sắp xếp theo thứ tự ban đầu
    const result = employerIds
      .map((id) => {
        const employer = employers.find((e) => e.id === id);
        if (!employer) return null;

        // Get unique provinces from locations
        const uniqueLocations = Array.from(
          new Set(
            employer.locations
              ?.map((loc) => loc.province)
              .filter(Boolean) || [],
          ),
        );

        // Get category names with type checking
        const categories = employer.employerCategories
          ?.map((ec) => {
            if (ec.category && typeof ec.category.name === 'string') {
              return ec.category.name;
            }
            return null;
          })
          .filter((name): name is string => name !== null) || [];

        return {
          id: employer.id,
          companyName: employer.companyName,
          logoUrl: employer.logoUrl,
          categories,
          locations: uniqueLocations,
          jobCount: jobCountMap.get(id) || 0,
        };
      })
      .filter(Boolean);

    return result;
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
      relations: [
        'locations',
        'employerCategories',
        'employerCategories.category',
      ],
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
      categories:
        employer.employerCategories
          ?.map((ec) => ec.category)
          .filter(Boolean)
          .map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
          })) ?? [],
      locations: employer.locations,
      createdAt: employer.createdAt,
      updatedAt: employer.updatedAt,
    };
  }
}
