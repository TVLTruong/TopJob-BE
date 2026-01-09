// src/modules/saved-jobs/saved-jobs.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedJob } from '../../database/entities/saved-job.entity';
import { Job } from '../../database/entities/job.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationResponseDto } from '../../common/dto/pagination-response.dto';

export interface SaveJobResponse {
  saved: boolean;
  message: string;
}

export interface UnsaveJobResponse {
  saved: boolean;
  message: string;
}

export interface CheckJobSavedResponse {
  isSaved: boolean;
  data: {
    candidateId: string;
    jobId: string;
  };
}

@Injectable()
export class SavedJobsService {
  constructor(
    @InjectRepository(SavedJob)
    private readonly savedJobRepo: Repository<SavedJob>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
  ) {}

  /**
   * Get all saved jobs for a candidate with pagination
   */
  async getSavedJobs(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<Job>> {
    const candidate = await this.getCandidateByUserId(userId);
    const candidateId = candidate.id;

    // Get saved jobs with job details
    const queryBuilder = this.savedJobRepo
      .createQueryBuilder('savedJob')
      .leftJoinAndSelect('savedJob.job', 'job')
      .leftJoinAndSelect('job.employer', 'employer')
      .leftJoinAndSelect('job.location', 'location')
      .leftJoinAndSelect('job.jobCategories', 'jobCategory')
      .leftJoinAndSelect('jobCategory.category', 'category')
      .leftJoinAndSelect('job.jobTechnologies', 'jobTechnology')
      .leftJoinAndSelect('jobTechnology.technology', 'technology')
      .where('savedJob.candidateId = :candidateId', { candidateId })
      .orderBy('savedJob.savedAt', 'DESC');

    // Map the result to return only job data
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [savedJobs, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const jobs = savedJobs.map((savedJob) => savedJob.job);

    return {
      data: jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Save a job for a candidate
   */
  async saveJob(userId: string, jobId: string): Promise<SaveJobResponse> {
    const candidate = await this.getCandidateByUserId(userId);
    const candidateId = candidate.id;

    // Verify job exists
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if already saved
    const existingSave = await this.savedJobRepo.findOne({
      where: { candidateId, jobId },
    });
    if (existingSave) {
      throw new BadRequestException('Job is already saved');
    }

    // Save the job
    const savedJob = this.savedJobRepo.create({
      candidateId,
      jobId,
      savedAt: new Date(),
    });

    await this.savedJobRepo.save(savedJob);

    return {
      saved: true,
      message: 'Job saved successfully',
    };
  }

  /**
   * Unsave a job for a candidate
   */
  async unsaveJob(userId: string, jobId: string): Promise<UnsaveJobResponse> {
    const candidate = await this.getCandidateByUserId(userId);
    const candidateId = candidate.id;

    // Find and delete the saved job
    const savedJob = await this.savedJobRepo.findOne({
      where: { candidateId, jobId },
    });

    if (!savedJob) {
      throw new NotFoundException('Saved job not found');
    }

    await this.savedJobRepo.remove(savedJob);

    return {
      saved: false,
      message: 'Job unsaved successfully',
    };
  }

  /**
   * Check if a job is saved by a candidate
   */
  async checkJobSaved(
    userId: string,
    jobId: string,
  ): Promise<CheckJobSavedResponse> {
    const candidate = await this.getCandidateByUserId(userId);
    const candidateId = candidate.id;

    const savedJob = await this.savedJobRepo.findOne({
      where: { candidateId, jobId },
    });

    return {
      isSaved: !!savedJob,
      data: { candidateId, jobId },
    };
  }

  /** Resolve candidate from userId to enforce candidate-only operations */
  private async getCandidateByUserId(userId: string): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({ where: { userId } });
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }
}
