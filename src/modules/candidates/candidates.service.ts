// src/modules/candidates/candidates.service.ts

import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import {
  UpdateCandidateProfileDto,
  CandidateProfileResponseDto,
  UploadCvDto,
  UploadAvatarResponseDto,
  SetDefaultCvResponseDto,
  DeleteCvResponseDto,
  ToggleSavedJobResponseDto,
  ApplyJobDto,
  ApplyJobResponseDto,
} from './dto';
import { CandidateCv, Job, Application } from '../../database/entities';
import {
  CandidateProfileService,
  CandidateCvService,
  CandidateJobService,
} from './services';

/**
 * Candidates Service (Orchestration)
 * Delegates work to specialized services
 * UC-CAN-01: Hoàn thiện hồ sơ ứng viên
 * UC-CAN-02: Upload CV
 */
@Injectable()
export class CandidatesService {
  constructor(
    private readonly profileService: CandidateProfileService,
    private readonly cvService: CandidateCvService,
    private readonly jobService: CandidateJobService,
  ) {}

  // ==========================================
  // Profile Management
  // ==========================================

  async getProfileByUserId(
    userId: string,
  ): Promise<CandidateProfileResponseDto> {
    return this.profileService.getProfileByUserId(userId);
  }

  async getProfileByUserIdOrEmpty(
    userId: string,
  ): Promise<CandidateProfileResponseDto | Record<string, never>> {
    return this.profileService.getProfileByUserIdOrEmpty(userId);
  }

  async getProfileByCandidateId(
    candidateId: string,
  ): Promise<CandidateProfileResponseDto> {
    return this.profileService.getProfileByCandidateId(candidateId);
  }

  async getProfileByCandidateIdOrEmpty(
    candidateId: string,
  ): Promise<CandidateProfileResponseDto | Record<string, never>> {
    return this.profileService.getProfileByCandidateIdOrEmpty(candidateId);
  }

  async updateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfileResponseDto> {
    return this.profileService.updateProfile(userId, dto);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    return this.profileService.uploadAvatar(userId, file);
  }

  // ==========================================
  // CV Management
  // ==========================================

  async uploadCv(
    userId: string,
    dto: UploadCvDto,
  ): Promise<CandidateProfileResponseDto> {
    await this.cvService.uploadCv(userId, dto);
    return this.profileService.getProfileByUserId(userId);
  }

  async deleteCv(
    userId: string,
    cvId: string,
  ): Promise<CandidateProfileResponseDto> {
    await this.cvService.deleteCv(userId, cvId);
    return this.profileService.getProfileByUserId(userId);
  }

  async deleteCvWithMessage(
    userId: string,
    cvId: string,
  ): Promise<DeleteCvResponseDto> {
    return this.cvService.deleteCv(userId, cvId);
  }

  async setDefaultCv(
    userId: string,
    cvId: string,
  ): Promise<CandidateProfileResponseDto> {
    await this.cvService.setDefaultCv(userId, cvId);
    return this.profileService.getProfileByUserId(userId);
  }

  async setDefaultCvWithMessage(
    userId: string,
    cvId: string,
  ): Promise<SetDefaultCvResponseDto> {
    return this.cvService.setDefaultCv(userId, cvId);
  }

  async getCvs(userId: string): Promise<CandidateCv[]> {
    return this.cvService.getCvs(userId);
  }

  async downloadCv(
    userId: string,
    cvId: string,
  ): Promise<{ stream: Readable; fileName: string }> {
    return await this.cvService.downloadCv(userId, cvId);
  }

  // ==========================================
  // Job & Applications
  // ==========================================

  async toggleSavedJob(
    userId: string,
    jobId: string,
  ): Promise<ToggleSavedJobResponseDto> {
    return this.jobService.toggleSavedJob(userId, jobId);
  }

  async getSavedJobs(userId: string): Promise<Job[]> {
    return this.jobService.getSavedJobs(userId);
  }

  async applyJob(
    userId: string,
    jobId: string,
    dto: ApplyJobDto,
  ): Promise<ApplyJobResponseDto> {
    return this.jobService.applyJob(userId, jobId, dto);
  }

  async getApplications(userId: string): Promise<Application[]> {
    return this.jobService.getApplications(userId);
  }
}
