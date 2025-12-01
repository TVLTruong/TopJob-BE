// src/modules/candidates/candidates.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Candidate, CandidateCv, User } from '../../database/entities';
import { UserStatus } from '../../common/enums';
import {
  UpdateCandidateProfileDto,
  CandidateProfileResponseDto,
  UploadCvDto,
} from './dto';

/**
 * Candidates Service
 * Handles candidate profile management
 * UC-CAN-01: Hoàn thiện hồ sơ ứng viên
 * UC-CAN-02: Upload CV
 */
@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(CandidateCv)
    private readonly cvRepository: Repository<CandidateCv>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get candidate profile by user ID
   */
  async getProfileByUserId(
    userId: string,
  ): Promise<CandidateProfileResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['user', 'cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    return this.mapToProfileResponse(candidate);
  }

  /**
   * Get candidate profile by candidate ID
   */
  async getProfileById(id: string): Promise<CandidateProfileResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['user', 'cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    return this.mapToProfileResponse(candidate);
  }

  /**
   * Update candidate profile (Next Step after registration)
   * UC-CAN-01: Hoàn thiện hồ sơ ứng viên
   */
  async updateProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfileResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['user', 'cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Update candidate fields
    Object.assign(candidate, {
      fullName: dto.fullName ?? candidate.fullName,
      gender: dto.gender ?? candidate.gender,
      dateOfBirth: dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : candidate.dateOfBirth,
      phoneNumber: dto.phoneNumber ?? candidate.phoneNumber,
      avatarUrl: dto.avatarUrl ?? candidate.avatarUrl,
      bio: dto.bio ?? candidate.bio,
      personalUrl: dto.personalUrl ?? candidate.personalUrl,
      addressStreet: dto.addressStreet ?? candidate.addressStreet,
      addressDistrict: dto.addressDistrict ?? candidate.addressDistrict,
      addressCity: dto.addressCity ?? candidate.addressCity,
      addressCountry: dto.addressCountry ?? candidate.addressCountry,
      experienceYears: dto.experienceYears ?? candidate.experienceYears,
      experienceLevel: dto.experienceLevel ?? candidate.experienceLevel,
      educationLevel: dto.educationLevel ?? candidate.educationLevel,
    });

    // Update user status if profile is complete enough
    const user = candidate.user;
    if (user && user.status === UserStatus.PENDING_PROFILE_COMPLETION) {
      if (this.isProfileComplete(candidate)) {
        user.status = UserStatus.ACTIVE;
        await this.userRepository.save(user);
      }
    }

    const savedCandidate = await this.candidateRepository.save(candidate);

    // Reload with relations
    const reloadedCandidate = await this.candidateRepository.findOne({
      where: { id: savedCandidate.id },
      relations: ['user', 'cvs'],
    });

    return this.mapToProfileResponse(reloadedCandidate!);
  }

  /**
   * Upload CV
   * UC-CAN-02: Upload CV
   */
  async uploadCv(
    userId: string,
    dto: UploadCvDto,
  ): Promise<CandidateProfileResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Check max CVs limit (e.g., 5 CVs per candidate)
    if (candidate.cvs && candidate.cvs.length >= 5) {
      throw new BadRequestException(
        'Bạn đã đạt giới hạn số lượng CV (tối đa 5)',
      );
    }

    // Create new CV
    const cv = this.cvRepository.create({
      candidateId: candidate.id,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      fileSize: dto.fileSize ?? null,
      isDefault: dto.isDefault ?? false,
      uploadedAt: new Date(),
    });

    // If this is set as default, unset other defaults
    if (cv.isDefault && candidate.cvs) {
      await this.cvRepository.update(
        { candidateId: candidate.id, isDefault: true },
        { isDefault: false },
      );
    }

    // If this is the first CV, set as default
    if (!candidate.cvs || candidate.cvs.length === 0) {
      cv.isDefault = true;
    }

    await this.cvRepository.save(cv);

    return this.getProfileByUserId(userId);
  }

  /**
   * Delete CV
   */
  async deleteCv(
    userId: string,
    cvId: string,
  ): Promise<CandidateProfileResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    const cv = candidate.cvs?.find((c) => c.id === cvId);
    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV');
    }

    const wasDefault = cv.isDefault;
    await this.cvRepository.remove(cv);

    // If deleted CV was default, set another as default
    if (wasDefault) {
      const remainingCvs = await this.cvRepository.find({
        where: { candidateId: candidate.id },
        order: { uploadedAt: 'DESC' },
      });

      if (remainingCvs.length > 0) {
        remainingCvs[0].isDefault = true;
        await this.cvRepository.save(remainingCvs[0]);
      }
    }

    return this.getProfileByUserId(userId);
  }

  /**
   * Set default CV
   */
  async setDefaultCv(
    userId: string,
    cvId: string,
  ): Promise<CandidateProfileResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    const cv = candidate.cvs?.find((c) => c.id === cvId);
    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV');
    }

    // Unset all defaults for this candidate
    await this.cvRepository.update(
      { candidateId: candidate.id },
      { isDefault: false },
    );

    // Set new default
    cv.isDefault = true;
    await this.cvRepository.save(cv);

    return this.getProfileByUserId(userId);
  }

  /**
   * Get all CVs for a candidate
   */
  async getCvs(userId: string): Promise<CandidateCv[]> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    return this.cvRepository.find({
      where: { candidateId: candidate.id },
      order: { isDefault: 'DESC', uploadedAt: 'DESC' },
    });
  }

  /**
   * Check if profile is complete enough to activate
   */
  private isProfileComplete(candidate: Candidate): boolean {
    return !!(candidate.fullName && candidate.gender && candidate.dateOfBirth);
  }

  /**
   * Map Candidate entity to response DTO
   */
  private mapToProfileResponse(
    candidate: Candidate,
  ): CandidateProfileResponseDto {
    return {
      id: candidate.id,
      userId: candidate.userId,
      fullName: candidate.fullName,
      email: candidate.user?.email,
      gender: candidate.gender,
      dateOfBirth: candidate.dateOfBirth,
      phoneNumber: candidate.phoneNumber,
      avatarUrl: candidate.avatarUrl,
      bio: candidate.bio,
      personalUrl: candidate.personalUrl,
      addressStreet: candidate.addressStreet,
      addressDistrict: candidate.addressDistrict,
      addressCity: candidate.addressCity,
      addressCountry: candidate.addressCountry,
      experienceYears: candidate.experienceYears,
      experienceLevel: candidate.experienceLevel,
      educationLevel: candidate.educationLevel,
      cvs: candidate.cvs?.map((cv) => ({
        id: cv.id,
        fileName: cv.fileName,
        fileUrl: cv.fileUrl,
        fileSize: cv.fileSize,
        isDefault: cv.isDefault,
        uploadedAt: cv.uploadedAt,
      })),
      fullAddress: candidate.getFullAddress(),
      age: candidate.getAge(),
      hasCV: candidate.hasCV(),
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }
}
