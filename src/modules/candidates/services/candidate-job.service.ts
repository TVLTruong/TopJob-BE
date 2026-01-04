// src/modules/candidates/services/candidate-job.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Candidate,
  CandidateCv,
  SavedJob,
  Job,
  Application,
} from '../../../database/entities';
import { ApplicationStatus, JobStatus } from '../../../common/enums';
import {
  ToggleSavedJobResponseDto,
  ApplyJobDto,
  ApplyJobResponseDto,
} from '../dto';

/**
 * Candidate Job Service
 * Handles saved jobs and job applications
 */
@Injectable()
export class CandidateJobService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(SavedJob)
    private readonly savedJobRepository: Repository<SavedJob>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  /**
   * Toggle saved job (save/unsave)
   * If not saved -> create SavedJob
   * If already saved -> delete SavedJob
   */
  async toggleSavedJob(
    userId: string,
    jobId: string,
  ): Promise<ToggleSavedJobResponseDto> {
    // Get candidate
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Check if job exists
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    // Check if already saved
    const existingSavedJob = await this.savedJobRepository.findOne({
      where: {
        candidateId: candidate.id,
        jobId: jobId,
      },
    });

    if (existingSavedJob) {
      // Already saved -> remove it
      await this.savedJobRepository.remove(existingSavedJob);
      return { saved: false };
    } else {
      // Not saved yet -> create it
      const savedJob = this.savedJobRepository.create({
        candidateId: candidate.id,
        jobId: jobId,
        savedAt: new Date(),
      });
      await this.savedJobRepository.save(savedJob);
      return { saved: true };
    }
  }

  /**
   * Get all saved jobs for candidate
   */
  async getSavedJobs(userId: string): Promise<Job[]> {
    // Get candidate
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Get all saved jobs with job details
    const savedJobs = await this.savedJobRepository.find({
      where: { candidateId: candidate.id },
      relations: [
        'job',
        'job.employer',
        'job.jobCategories',
        'job.jobCategories.category',
        'job.location',
      ],
      order: { savedAt: 'DESC' },
    });

    // Return only the job entities
    return savedJobs.map((savedJob) => savedJob.job);
  }

  /**
   * Apply to a job
   */
  async applyJob(
    userId: string,
    jobId: string,
    dto: ApplyJobDto,
  ): Promise<ApplyJobResponseDto> {
    // Get candidate with CVs
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Check if candidate has at least one CV
    if (!candidate.cvs || candidate.cvs.length === 0) {
      throw new BadRequestException('Bạn cần có ít nhất một CV để ứng tuyển');
    }

    // Check if job exists and is ACTIVE
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    if (job.status !== JobStatus.ACTIVE) {
      throw new BadRequestException('Công việc này không còn nhận ứng tuyển');
    }

    // Check if already applied
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        candidateId: candidate.id,
        jobId: jobId,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Bạn đã ứng tuyển công việc này rồi');
    }

    // Determine which CV to use
    let cvToUse: CandidateCv | undefined;

    if (dto.cvId) {
      // Use specified CV - must belong to candidate
      cvToUse = candidate.cvs.find((cv) => cv.id === dto.cvId);
      if (!cvToUse) {
        throw new BadRequestException(
          'CV không tồn tại hoặc không thuộc về bạn',
        );
      }
    } else {
      // Use default CV
      cvToUse = candidate.cvs.find((cv) => cv.isDefault);
      if (!cvToUse) {
        // If no default CV, use the first one
        cvToUse = candidate.cvs[0];
      }
    }

    // Create application
    const application = this.applicationRepository.create({
      candidateId: candidate.id,
      jobId: jobId,
      cvId: cvToUse.id,
      status: ApplicationStatus.NEW,
      appliedAt: new Date(),
    });
    const savedApplication = await this.applicationRepository.save(application);

    return {
      message: 'Ứng tuyển thành công',
      applicationId: savedApplication.id,
    };
  }

  /**
   * Get all applications for candidate
   */
  async getApplications(userId: string): Promise<Application[]> {
    // Get candidate
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Get all applications with job and cv details
    const applications = await this.applicationRepository.find({
      where: { candidateId: candidate.id },
      relations: [
        'job',
        'job.employer',
        'job.jobCategories',
        'job.jobCategories.category',
        'job.location',
        'cv',
      ],
      order: { createdAt: 'DESC' },
    });

    return applications;
  }
}
