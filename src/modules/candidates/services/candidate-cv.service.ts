// src/modules/candidates/services/candidate-cv.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate, CandidateCv } from '../../../database/entities';
import {
  UploadCvDto,
  SetDefaultCvResponseDto,
  DeleteCvResponseDto,
} from '../dto';
import { StorageService } from '../../storage/storage.service';

/**
 * Candidate CV Service
 * Handles CV upload, delete, and management
 */
@Injectable()
export class CandidateCvService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepository: Repository<Candidate>,
    @InjectRepository(CandidateCv)
    private readonly cvRepository: Repository<CandidateCv>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Upload CV
   * UC-CAN-02: Upload CV
   */
  async uploadCv(userId: string, dto: UploadCvDto): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { userId },
      relations: ['cvs'],
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Check max CVs limit (5 CVs per candidate)
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
  }

  /**
   * Delete CV with message response
   */
  async deleteCv(userId: string, cvId: string): Promise<DeleteCvResponseDto> {
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
    const cvIdToDelete = cv.id;

    // Extract publicId from fileUrl and delete from cloud storage
    await this.deleteFileFromStorage(cv.fileUrl);

    // Delete CV record
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

    return {
      message: 'Đã xóa CV thành công',
      deletedCvId: cvIdToDelete,
    };
  }

  /**
   * Set default CV with message response
   */
  async setDefaultCv(
    userId: string,
    cvId: string,
  ): Promise<SetDefaultCvResponseDto> {
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

    return {
      message: 'Đã đặt CV làm mặc định',
      cvId: cv.id,
    };
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
   * Extract publicId from Cloudinary URL and delete file
   */
  private async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      // Extract publicId from Cloudinary URL
      // Example: https://res.cloudinary.com/demo/raw/upload/v1234567890/topjob/cvs/file.pdf
      // publicId: topjob/cvs/file
      const urlParts = fileUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Skip version (v1234567890)
        const pathAfterVersion = urlParts.slice(uploadIndex + 2);
        // Remove file extension from last part
        const lastPart = pathAfterVersion[pathAfterVersion.length - 1];
        const fileName = lastPart.substring(0, lastPart.lastIndexOf('.'));
        pathAfterVersion[pathAfterVersion.length - 1] = fileName;
        const publicId = pathAfterVersion.join('/');

        await this.storageService.deleteFile(publicId);
      }
    } catch (error) {
      // Log error but don't fail the deletion
      // File might already be deleted or URL format is different
      console.warn('Failed to delete file from storage:', error);
    }
  }
}
