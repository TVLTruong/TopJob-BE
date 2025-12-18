// src/modules/candidates/services/candidate-profile.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate, User } from '../../../database/entities';
import { UserStatus } from '../../../common/enums';
import {
  UpdateCandidateProfileDto,
  CandidateProfileResponseDto,
  UploadAvatarResponseDto,
} from '../dto';
import { StorageService } from '../../storage/storage.service';

/**
 * Candidate Profile Service
 * Handles candidate profile CRUD operations
 */
@Injectable()
export class CandidateProfileService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get candidate profile by user ID
   * Throws NotFoundException if profile not found
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
   * Get candidate profile by user ID or return empty object
   */
  async getProfileByUserIdOrEmpty(
    userId: string,
  ): Promise<CandidateProfileResponseDto | Record<string, never>> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['user', 'cvs'],
    });

    if (!candidate) {
      return {};
    }

    return this.mapToProfileResponse(candidate);
  }

  /**
   * Update candidate profile
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
   * Upload avatar for candidate
   */
  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Upload file to Cloudinary
    const uploadResult = await this.storageService.uploadCandidateAvatar(file);

    // Update candidate avatar URL
    candidate.avatarUrl = uploadResult.url;
    await this.candidateRepository.save(candidate);

    return {
      avatarUrl: uploadResult.url,
    };
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
