// src/modules/jobs/jobs.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, DeepPartial } from 'typeorm';
import { Job } from '../../database/entities/job.entity'; // 👈 Nối dây (Lớp 1)
import { Employer } from '../../database/entities/employer.entity';
import { EmployerLocation } from '../../database/entities/employer-location.entity';
import { Application } from '../../database/entities/application.entity';
import { JobStatus, UserStatus } from '../../common/enums'; // 👈 Nối dây (Tool)
import { SearchJobsDto } from './dto/search-jobs.dto';
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
    // (Bạn có thể inject 'job.repository.ts' (custom) nếu cần)
  ) { }

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

    const jobData: DeepPartial<Job> = {
      employerId: employer.id,
      categoryId: dto.categoryId,
      locationId: dto.locationId,
      title: dto.title,
      slug,
      description: dto.description ?? undefined,
      requirements: dto.requirements ?? undefined,
      responsibilities: dto.responsibilities ?? undefined,
      niceToHave: dto.niceToHave ?? undefined,
      salaryMin: dto.salaryMin ?? undefined,
      salaryMax: dto.salaryMax ?? undefined,
      isNegotiable: dto.isNegotiable ?? false,
      jobType: dto.jobType,
      experienceLevel: dto.experienceLevel ?? undefined,
      positionsAvailable: dto.positionsAvailable ?? 1,
      requiredSkills: dto.requiredSkills ?? undefined,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      status: JobStatus.PENDING_APPROVAL,
      publishedAt: undefined,
    };

    const job = this.jobRepo.create(jobData);

    const saved = await this.jobRepo.save(job);
    return { jobId: saved.id, status: saved.status };
  }

  /**
   * Get jobs for current employer with pagination
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
      .orderBy('job.createdAt', 'DESC');

    return createPaginationResponse(
      queryBuilder,
      pagination.page,
      pagination.limit,
    );
  }

  /**
   * Update job for employer with ownership enforcement
   */
  async updateJobForEmployer(
    userId: string,
    jobId: string,
    dto: UpdateJobDto,
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

    const ensureLocation = async (locId: string) => {
      const location = await this.locationRepo.findOne({
        where: { id: locId, employerId: employer.id },
      });
      if (!location) {
        throw new BadRequestException('locationId không thuộc nhà tuyển dụng');
      }
    };

    let requiresReapproval = false;
    const originalTitle = job.title;

    const compareAndSet = <K extends keyof Job>(
      field: K,
      value: Job[K] | undefined,
    ) => {
      if (typeof value === 'undefined') {
        return;
      }

      const currentValue = job[field];
      let hasChanged = false;

      if (value instanceof Date && currentValue instanceof Date) {
        hasChanged = currentValue.getTime() !== value.getTime();
      } else if (Array.isArray(value) && Array.isArray(currentValue)) {
        hasChanged =
          JSON.stringify(currentValue ?? []) !== JSON.stringify(value ?? []);
      } else if (value !== currentValue) {
        hasChanged = true;
      }

      if (hasChanged) {
        requiresReapproval = true;
      }

      job[field] = value;
    };

    if (dto.locationId) {
      await ensureLocation(dto.locationId);
    }

    compareAndSet('title', dto.title as Job['title'] | undefined);
    compareAndSet('description', dto.description as Job['description'] | undefined);
    compareAndSet('requirements', dto.requirements as Job['requirements'] | undefined);
    compareAndSet(
      'responsibilities',
      dto.responsibilities as Job['responsibilities'] | undefined,
    );
    compareAndSet('niceToHave', dto.niceToHave as Job['niceToHave'] | undefined);
    compareAndSet('salaryMin', dto.salaryMin as Job['salaryMin'] | undefined);
    compareAndSet('salaryMax', dto.salaryMax as Job['salaryMax'] | undefined);
    compareAndSet(
      'isNegotiable',
      dto.isNegotiable as Job['isNegotiable'] | undefined,
    );
    compareAndSet('jobType', dto.jobType as Job['jobType'] | undefined);
    compareAndSet(
      'experienceLevel',
      dto.experienceLevel as Job['experienceLevel'] | undefined,
    );
    compareAndSet(
      'positionsAvailable',
      dto.positionsAvailable as Job['positionsAvailable'] | undefined,
    );
    compareAndSet(
      'requiredSkills',
      dto.requiredSkills as Job['requiredSkills'] | undefined,
    );

    if (typeof dto.deadline !== 'undefined') {
      const nextDeadline = dto.deadline
        ? new Date(dto.deadline as unknown as string)
        : undefined;
      compareAndSet('deadline', nextDeadline as unknown as Job['deadline']);
    }

    compareAndSet('locationId', dto.locationId as Job['locationId'] | undefined);
    compareAndSet('categoryId', dto.categoryId as Job['categoryId'] | undefined);

    if (
      typeof dto.title !== 'undefined' &&
      dto.title &&
      dto.title !== originalTitle
    ) {
      job.slug = this.generateSlug(dto.title);
    }

    if (requiresReapproval) {
      job.status = JobStatus.PENDING_APPROVAL;
      job.publishedAt = null as unknown as Date;
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