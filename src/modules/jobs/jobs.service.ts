// src/modules/jobs/jobs.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Job } from '../../database/entities/job.entity'; // 👈 Nối dây (Lớp 1)
import { Employer } from '../../database/entities/employer.entity';
import { EmployerLocation } from '../../database/entities/employer-location.entity';
import { Application } from '../../database/entities/application.entity';
import { JobJobCategory } from '../../database/entities/job-job-category.entity';
import { JobTechnology } from '../../database/entities/job-technology.entity';
import { JobStatus, UserStatus } from '../../common/enums'; // 👈 Nối dây (Tool)
import { SearchJobsDto } from './dto/search-jobs.dto';
import {
  PublicSearchJobsDto,
  JobSortOption,
} from './dto/public-search-jobs.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateJobResponseDto } from './dto/create-job-response.dto';
import { createPaginationResponse } from '../../common/utils/query-builder.util'; // (Dùng 'tool' chung)
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Employer)
    private readonly employerRepo: Repository<Employer>,
    @InjectRepository(EmployerLocation)
    private readonly locationRepo: Repository<EmployerLocation>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(JobJobCategory)
    private readonly jobJobCategoryRepo: Repository<JobJobCategory>,
    @InjectRepository(JobTechnology)
    private readonly jobTechnologyRepo: Repository<JobTechnology>,
    // (Bạn có thể inject 'job.repository.ts' (custom) nếu cần)
  ) {}

  /**
   * PUBLIC API - Tìm kiếm việc làm công khai cho Guest/Candidate
   * UC-GUEST-01: Tìm kiếm việc làm
   *
   * Features:
   * - Chỉ trả về jobs có status = ACTIVE và chưa hết hạn
   * - Tìm kiếm theo keyword (title, description)
   * - Filter: location, experienceLevel, jobType, salaryMin, salaryMax
   * - Sort: newest (publishedAt DESC), relevant (isUrgent, isFeatured)
   * - Pagination: page, limit
   * - Query tối ưu với QueryBuilder
   */
  async findAllPublic(
    dto: PublicSearchJobsDto,
  ): Promise<PaginationResponseDto<Job>> {
    // 1. Khởi tạo QueryBuilder với các relations cần thiết
    const queryBuilder = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.employer', 'employer')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.jobCategories', 'jobCategory')
      .leftJoinAndSelect('jobCategory.category', 'category');

    // 2. Filter cơ bản: Chỉ lấy ACTIVE jobs và chưa hết hạn
    queryBuilder
      .where('job.status = :status', { status: JobStatus.ACTIVE })
      .andWhere('job.expiredAt > :now', { now: new Date() });

    // 3. Tìm kiếm theo keyword (title hoặc description)
    if (dto.keyword && dto.keyword.trim()) {
      queryBuilder.andWhere(
        '(job.title ILIKE :keyword OR job.description ILIKE :keyword)',
        { keyword: `%${dto.keyword.trim()}%` },
      );
    }

    // 4. Filter theo location (city/province)
    if (dto.location && dto.location.trim()) {
      queryBuilder.andWhere('location.province ILIKE :location', {
        location: `%${dto.location.trim()}%`,
      });
    }

    // 5. Filter theo jobType
    if (dto.jobType) {
      queryBuilder.andWhere('job.jobType = :jobType', {
        jobType: dto.jobType,
      });
    }

    // 6. Filter theo experienceLevel
    if (dto.experienceLevel) {
      queryBuilder.andWhere('job.experienceLevel = :experienceLevel', {
        experienceLevel: dto.experienceLevel,
      });
    }

    // 7. Filter theo salary range
    if (dto.salaryMin !== undefined && dto.salaryMin > 0) {
      // Lấy jobs có salaryMax >= salaryMin của user
      queryBuilder.andWhere(
        '(job.salaryMax >= :salaryMin OR job.isNegotiable = true)',
        { salaryMin: dto.salaryMin },
      );
    }

    if (dto.salaryMax !== undefined && dto.salaryMax > 0) {
      // Lấy jobs có salaryMin <= salaryMax của user
      queryBuilder.andWhere(
        '(job.salaryMin <= :salaryMax OR job.isNegotiable = true)',
        { salaryMax: dto.salaryMax },
      );
    }

    // 8. Sorting
    if (dto.sort === JobSortOption.RELEVANT) {
      // Sắp xếp theo độ liên quan: ưu tiên isUrgent, isFeatured, sau đó publishedAt
      queryBuilder
        .addOrderBy('job.isUrgent', 'DESC')
        .addOrderBy('job.isFeatured', 'DESC')
        .addOrderBy('job.publishedAt', 'DESC');
    } else {
      // Default: Sắp xếp theo mới nhất
      queryBuilder.orderBy('job.publishedAt', 'DESC');
    }

    // 9. Pagination và trả về kết quả
    return createPaginationResponse(queryBuilder, dto.page, dto.limit);
  }

  /**
   * (OLD METHOD - kept for backward compatibility)
   * (Dịch từ UC-GUEST-01: Tìm kiếm việc làm )
   * Lấy danh sách việc làm CÔNG KHAI (Public)
   */
  async findAllPublicOld(
    dto: SearchJobsDto,
  ): Promise<PaginationResponseDto<Job>> {
    // 1. Tạo QueryBuilder (công cụ truy vấn động)
    const queryBuilder = this.jobRepo.createQueryBuilder('job');

    // 2. Chỉ lấy tin "ACTIVE" (Dịch từ UC-GUEST-01, Bước 4 [cite: 190])
    queryBuilder
      .where('job.status = :status', { status: JobStatus.ACTIVE })
      .andWhere('job.expiredAt > :now', { now: new Date() }); // (Và "còn hạn")

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
    return createPaginationResponse(queryBuilder, dto.page, dto.limit);
  }

  /**
   * PUBLIC API - Xem chi tiết Job công khai
   * UC-GUEST-02: Xem chi tiết việc làm
   *
   * Features:
   * - Hỗ trợ tìm kiếm bằng ID hoặc Slug
   * - Chỉ cho phép xem jobs có status = ACTIVE
   * - Load đầy đủ employer profile và location
   * - Xử lý rõ ràng các trường hợp: EXPIRED, DELETED, NOT_FOUND
   * - Tự động tăng view count
   *
   * @param identifier - Job ID hoặc Job Slug
   * @returns Job với đầy đủ thông tin
   * @throws NotFoundException - Job không tồn tại, đã hết hạn hoặc không active
   */
  async findOnePublicByIdentifier(identifier: string): Promise<Job> {
    // 1. Xác định identifier là ID hay Slug
    const isNumericId = /^\d+$/.test(identifier);

    // 2. Tìm job theo ID hoặc Slug (không filter status để xử lý message cụ thể)
    const job = await this.jobRepo.findOne({
      where: isNumericId ? { id: identifier } : { slug: identifier },
      relations: [
        'employer',
        'employer.user',
        'location',
        'jobCategories',
        'jobCategories.category',
        'jobTechnologies',
        'jobTechnologies.technology',
      ],
    });

    // 3. Job không tồn tại
    if (!job) {
      throw new NotFoundException(
        `Không tìm thấy việc làm với ${isNumericId ? 'ID' : 'slug'}: ${identifier}`,
      );
    }

    // 4. Job không phải ACTIVE
    if (job.status !== JobStatus.ACTIVE) {
      // Xử lý các trường hợp cụ thể
      if (job.status === JobStatus.EXPIRED) {
        throw new NotFoundException(
          'Tin tuyển dụng này đã hết hạn. Vui lòng tìm việc làm khác.',
        );
      }

      if (job.status === JobStatus.CLOSED) {
        throw new NotFoundException(
          'Tin tuyển dụng này đã đóng. Công ty đã tuyển đủ người.',
        );
      }

      if (job.status === JobStatus.REMOVED_BY_ADMIN) {
        throw new NotFoundException(
          'Tin tuyển dụng này đã bị gỡ bởi quản trị viên.',
        );
      }

      if (job.status === JobStatus.REJECTED) {
        throw new NotFoundException('Tin tuyển dụng này không được phê duyệt.');
      }

      // Các status khác (DRAFT, PENDING_APPROVAL, HIDDEN)
      throw new NotFoundException('Tin tuyển dụng này không khả dụng.');
    }

    // 5. Kiểm tra expiredAt
    if (job.expiredAt && new Date(job.expiredAt) <= new Date()) {
      throw new NotFoundException('Tin tuyển dụng này đã hết hạn ứng tuyển.');
    }

    // 6. Tăng view count (async, không chặn response)
    this.incrementViewCount(job.id).catch((error) => {
      // Log error nhưng không throw để không ảnh hưởng response
      console.error(`Failed to increment view count for job ${job.id}:`, error);
    });

    return job;
  }

  /**
   * Tăng view count cho job
   * Chạy async để không block response
   */
  private async incrementViewCount(jobId: string): Promise<void> {
    await this.jobRepo.increment({ id: jobId }, 'viewCount', 1);
  }

  /**
   * @deprecated Use findOnePublicByIdentifier instead
   * (Dịch từ UC-GUEST-02: Xem chi tiết việc làm )
   * Lấy 1 việc làm CÔNG KHAI bằng Slug
   */
  async findOnePublicBySlug(slug: string): Promise<Job> {
    return this.findOnePublicByIdentifier(slug);
  }

  /**
   * Create job for employer
   * - Enforce ownership via userId -> employer -> location
   * - Require user.status = ACTIVE
   * - Set job.status = PENDING_APPROVAL
   */
  async createJobForEmployer(
    userId: string,
    dto: CreateJobDto,
  ): Promise<CreateJobResponseDto> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    if (employer.user?.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Tài khoản chưa hoạt động');
    }

    const location = await this.locationRepo.findOne({
      where: { id: dto.locationId, employerId: employer.id },
    });

    if (!location) {
      throw new BadRequestException('locationId không thuộc nhà tuyển dụng');
    }

    const slug = this.generateSlug(dto.title);

    // Validate categoryIds
    if (!dto.categoryIds || dto.categoryIds.length === 0) {
      throw new BadRequestException('Phải có ít nhất 1 danh mục');
    }

    // Determine primary category
    const primaryCategoryId =
      dto.primaryCategoryId && dto.categoryIds.includes(dto.primaryCategoryId)
        ? dto.primaryCategoryId
        : dto.categoryIds[0];

    const jobData: DeepPartial<Job> = {
      employerId: employer.id,
      locationId: dto.locationId,
      title: dto.title,
      slug,
      description: dto.description ?? undefined,
      requirements: dto.requirements ?? undefined,
      responsibilities: dto.responsibilities ?? undefined,
      niceToHave: dto.niceToHave ?? undefined,
      benefits: dto.benefits ?? undefined,
      salaryMin: dto.salaryMin ?? undefined,
      salaryMax: dto.salaryMax ?? undefined,
      isNegotiable: dto.isNegotiable ?? false,
      isSalaryVisible: dto.isSalaryVisible ?? true,
      salaryCurrency: dto.salaryCurrency ?? 'VND',
      employmentType: dto.employmentType,
      workMode: dto.workMode,
      experienceLevel: dto.experienceLevel ?? undefined,
      experienceYearsMin: dto.experienceYearsMin ?? undefined,
      quantity: dto.quantity ?? 1,
      expiredAt: dto.expiredAt ? new Date(dto.expiredAt) : undefined,
      isHot: dto.isHot ?? false,
      isUrgent: dto.isUrgent ?? false,
      status: JobStatus.PENDING_APPROVAL,
      publishedAt: undefined,
    };

    const job = this.jobRepo.create(jobData);
    const saved = await this.jobRepo.save(job);

    // Create JobJobCategory records
    const jobCategories = dto.categoryIds.map((categoryId) => {
      return this.jobJobCategoryRepo.create({
        jobId: saved.id,
        categoryId,
        isPrimary: categoryId === primaryCategoryId,
      });
    });

    await this.jobJobCategoryRepo.save(jobCategories);

    // Create JobTechnology records (if provided)
    if (dto.technologyIds && dto.technologyIds.length > 0) {
      const primaryTechnologyId =
        dto.primaryTechnologyId &&
        dto.technologyIds.includes(dto.primaryTechnologyId)
          ? dto.primaryTechnologyId
          : dto.technologyIds[0];

      const jobTechnologies = dto.technologyIds.map((technologyId) => {
        return this.jobTechnologyRepo.create({
          jobId: saved.id,
          technologyId,
          isPrimary: technologyId === primaryTechnologyId,
        });
      });

      await this.jobTechnologyRepo.save(jobTechnologies);
    }

    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Get jobs for current employer with pagination
   * Excludes jobs with status REMOVED_BY_ADMIN or REMOVED_BY_EMPLOYER
   */
  async getJobsForEmployer(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<Job>> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const queryBuilder = this.jobRepo
      .createQueryBuilder('job')
      .where('job.employerId = :employerId', { employerId: employer.id })
      .andWhere('job.status NOT IN (:...removedStatuses)', {
        removedStatuses: [
          JobStatus.REMOVED_BY_ADMIN,
          JobStatus.REMOVED_BY_EMPLOYER,
        ],
      })
      .orderBy('job.createdAt', 'DESC');

    return createPaginationResponse(
      queryBuilder,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * Get job detail for employer with ownership enforcement
   */
  async getJobDetailForEmployer(userId: string, jobId: string): Promise<Job> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
      relations: [
        'employer',
        'location',
        'jobCategories',
        'jobCategories.category',
        'jobTechnologies',
        'jobTechnologies.technology',
      ],
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    return job;
  }

  /**
   * Update job for employer with ownership enforcement
   */
  async updateJobForEmployer(
    userId: string,
    jobId: string,
    dto: UpdateJobDto,
  ): Promise<CreateJobResponseDto> {
    const employer = await this.employerRepo.findOne({ where: { userId } });
    if (!employer)
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    const ensureLocation = async (locId: string) => {
      const location = await this.locationRepo.findOne({
        where: { id: locId, employerId: employer.id },
      });
      if (!location)
        throw new BadRequestException('locationId không thuộc nhà tuyển dụng');
    };
    if (dto.locationId) await ensureLocation(dto.locationId);

    if (
      typeof dto.salaryMin === 'number' &&
      typeof dto.salaryMax === 'number' &&
      dto.salaryMax < dto.salaryMin
    )
      throw new BadRequestException(
        'salaryMax phải lớn hơn hoặc bằng salaryMin',
      );

    let requiresReapproval = false;
    const originalTitle = job.title;

    // compareAndSet type-safe
    const compareAndSet = <K extends keyof Job>(
      field: K,
      value: Job[K] | undefined,
    ) => {
      if (value === undefined) return;

      const currentValue = job[field];

      let hasChanged = false;

      if (value instanceof Date && currentValue instanceof Date) {
        hasChanged = currentValue.getTime() !== value.getTime();
      } else if (Array.isArray(value) && Array.isArray(currentValue)) {
        const sortedNew = [...value].sort();
        const sortedCurrent = [...currentValue].sort();
        hasChanged =
          JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew);
      } else if (value !== currentValue) {
        hasChanged = true;
      }

      if (hasChanged) requiresReapproval = true;

      // Gán giá trị chỉ khi không phải null
      if (value !== null) job[field] = value;
    };

    compareAndSet('title', dto.title);
    compareAndSet('description', dto.description ?? undefined);
    compareAndSet('requirements', dto.requirements ?? undefined);
    compareAndSet('responsibilities', dto.responsibilities ?? undefined);
    compareAndSet('niceToHave', dto.niceToHave ?? undefined);
    compareAndSet('benefits', dto.benefits ?? undefined);
    compareAndSet('salaryMin', dto.salaryMin ?? undefined);
    compareAndSet('salaryMax', dto.salaryMax ?? undefined);
    compareAndSet('isNegotiable', dto.isNegotiable ?? undefined);
    compareAndSet('isSalaryVisible', dto.isSalaryVisible ?? undefined);
    compareAndSet('salaryCurrency', dto.salaryCurrency ?? undefined);
    compareAndSet('employmentType', dto.employmentType ?? undefined);
    compareAndSet('workMode', dto.workMode ?? undefined);
    compareAndSet('experienceLevel', dto.experienceLevel ?? undefined);
    compareAndSet('experienceYearsMin', dto.experienceYearsMin ?? undefined);
    compareAndSet('quantity', dto.quantity ?? undefined);
    compareAndSet(
      'expiredAt',
      dto.expiredAt ? new Date(dto.expiredAt) : undefined,
    );
    compareAndSet('isHot', dto.isHot ?? undefined);
    compareAndSet('isUrgent', dto.isUrgent ?? undefined);
    compareAndSet('locationId', dto.locationId ?? undefined);

    // Handle categoryIds update
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      // Get current categories
      const currentCategories = await this.jobJobCategoryRepo.find({
        where: { jobId: job.id },
      });

      const currentCategoryIds = currentCategories.map((jc) => jc.categoryId);
      const newCategoryIds = dto.categoryIds;

      // Check if categories changed
      const sortedCurrent = [...currentCategoryIds].sort();
      const sortedNew = [...newCategoryIds].sort();
      const categoriesChanged =
        JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew);

      if (categoriesChanged) {
        requiresReapproval = true;

        // Remove old categories
        await this.jobJobCategoryRepo.delete({ jobId: job.id });

        // Determine primary category
        const primaryCategoryId =
          dto.primaryCategoryId &&
          newCategoryIds.includes(dto.primaryCategoryId)
            ? dto.primaryCategoryId
            : newCategoryIds[0];

        // Add new categories
        const jobCategories = newCategoryIds.map((categoryId) => {
          return this.jobJobCategoryRepo.create({
            jobId: job.id,
            categoryId,
            isPrimary: categoryId === primaryCategoryId,
          });
        });

        await this.jobJobCategoryRepo.save(jobCategories);
      }
    }

    // Handle technologyIds update
    if (dto.technologyIds !== undefined) {
      // Get current technologies
      const currentTechnologies = await this.jobTechnologyRepo.find({
        where: { jobId: job.id },
      });

      const currentTechnologyIds = currentTechnologies.map(
        (jt) => jt.technologyId,
      );
      const newTechnologyIds = dto.technologyIds || [];

      // Check if technologies changed
      const sortedCurrent = [...currentTechnologyIds].sort();
      const sortedNew = [...newTechnologyIds].sort();
      const technologiesChanged =
        JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew);

      if (technologiesChanged) {
        requiresReapproval = true;

        // Remove old technologies
        await this.jobTechnologyRepo.delete({ jobId: job.id });

        // Add new technologies (if any)
        if (newTechnologyIds.length > 0) {
          const primaryTechnologyId =
            dto.primaryTechnologyId &&
            newTechnologyIds.includes(dto.primaryTechnologyId)
              ? dto.primaryTechnologyId
              : newTechnologyIds[0];

          const jobTechnologies = newTechnologyIds.map((technologyId) => {
            return this.jobTechnologyRepo.create({
              jobId: job.id,
              technologyId,
              isPrimary: technologyId === primaryTechnologyId,
            });
          });

          await this.jobTechnologyRepo.save(jobTechnologies);
        }
      }
    }

    if (dto.title && dto.title !== originalTitle) {
      job.slug = this.generateSlug(dto.title);
    }

    if (requiresReapproval) {
      job.status = JobStatus.PENDING_APPROVAL;
      job.publishedAt = null; // dùng undefined thay cho null
    }

    const saved = await this.jobRepo.save(job);
    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Hide job (only ACTIVE) with ownership enforcement
   */
  async hideJobForEmployer(
    userId: string,
    jobId: string,
  ): Promise<CreateJobResponseDto> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Chỉ được ẩn tin khi đang ACTIVE');
    }

    job.status = JobStatus.HIDDEN;
    const saved = await this.jobRepo.save(job);
    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Unhide job (only HIDDEN) with ownership enforcement
   */
  async unhideJobForEmployer(
    userId: string,
    jobId: string,
  ): Promise<CreateJobResponseDto> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    if (job.status !== JobStatus.HIDDEN) {
      throw new BadRequestException('Chỉ được hủy ẩn tin khi đang HIDDEN');
    }

    job.status = JobStatus.ACTIVE;
    const saved = await this.jobRepo.save(job);
    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Close job (change status to CLOSED) with ownership enforcement
   */
  async closeJobForEmployer(
    userId: string,
    jobId: string,
  ): Promise<CreateJobResponseDto> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    if (job.status === JobStatus.CLOSED) {
      throw new BadRequestException('Tin tuyển dụng đã kết thúc');
    }

    job.status = JobStatus.CLOSED;
    const saved = await this.jobRepo.save(job);
    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Delete job (soft delete - change status to REMOVED_BY_EMPLOYER)
   * Employer can delete their own jobs
   */
  async deleteJobForEmployer(
    userId: string,
    jobId: string,
  ): Promise<CreateJobResponseDto> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    // Allow deletion from any status except already removed
    if (
      job.status === JobStatus.REMOVED_BY_ADMIN ||
      job.status === JobStatus.REMOVED_BY_EMPLOYER
    ) {
      throw new BadRequestException('Tin tuyển dụng đã bị xóa');
    }

    job.status = JobStatus.REMOVED_BY_EMPLOYER;
    const saved = await this.jobRepo.save(job);
    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Get applications for a job belonging to current employer
   */
  async getApplicationsForEmployerJob(
    userId: string,
    jobId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<Application>> {
    const employer = await this.employerRepo.findOne({
      where: { userId },
    });

    if (!employer) {
      throw new NotFoundException('Không tìm thấy hồ sơ nhà tuyển dụng');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId: employer.id },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }

    const qb = this.applicationRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.candidate', 'candidate')
      .leftJoinAndSelect('app.cv', 'cv')
      .leftJoinAndSelect('app.job', 'job')
      .where('app.jobId = :jobId', { jobId })
      .orderBy('app.appliedAt', 'DESC');

    return createPaginationResponse(qb, pagination.page, pagination.limit);
  }

  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return `${base}-${Date.now()}`;
  }
}
