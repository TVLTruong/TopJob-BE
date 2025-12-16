import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { Express } from 'express';

function isMulterFile(file: unknown): file is Express.Multer.File {
  return (
    !!file &&
    typeof file === 'object' &&
    'mimetype' in file &&
    'size' in file &&
    'buffer' in file
  );
}

export interface UploadedFileResult {
  url: string;
  publicId: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>(
        'storage.cloudinary.cloudName',
      ),
      api_key: this.configService.get<string>('storage.cloudinary.apiKey'),
      api_secret: this.configService.get<string>(
        'storage.cloudinary.apiSecret',
      ),
    });
  }

  async uploadCompanyLogo(
    file: Express.Multer.File,
  ): Promise<UploadedFileResult> {
    return this.uploadImage(file, 'topjob/logos');
  }

  async uploadCompanyCover(
    file: Express.Multer.File,
  ): Promise<UploadedFileResult> {
    return this.uploadImage(file, 'topjob/covers');
  }

  async uploadCandidateAvatar(
    file: Express.Multer.File,
  ): Promise<UploadedFileResult> {
    return this.uploadImage(file, 'topjob/avatars');
  }

  async uploadCV(file: unknown): Promise<UploadedFileResult> {
    this.validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['application/pdf'],
    });

    try {
      const result = await this.uploadBuffer(file.buffer, {
        folder: 'topjob/cvs',
        resource_type: 'raw',
        format: 'pdf',
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err: unknown) {
      this.handleUploadError(err, 'CV');
      // ✅ Tương tự, không cần return
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      this.logger.warn('Delete file failed', {
        publicId,
        message,
      });
    }
  }

  // ======================
  // Helpers
  // ======================

  private async uploadImage(
    file: unknown,
    folder: string,
  ): Promise<UploadedFileResult> {
    this.validateFile(file, {
      maxSize: 5 * 1024 * 1024,
      allowedMimeTypes: this.IMAGE_MIME_TYPES,
    });

    try {
      const result = await this.uploadBuffer(file.buffer, {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (err: unknown) {
      this.handleUploadError(err, 'image');
      // ✅ TypeScript biết handleUploadError throw, nên không cần return sau này
    }
  }

  private validateFile(
    file: unknown,
    options: {
      maxSize: number;
      allowedMimeTypes: string[];
    },
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('File không được để trống');
    }

    if (!isMulterFile(file)) {
      throw new BadRequestException('File không hợp lệ');
    }

    if (!options.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Định dạng file không được hỗ trợ');
    }

    if (file.size > options.maxSize) {
      throw new BadRequestException(
        `Kích thước file không được vượt quá ${
          options.maxSize / (1024 * 1024)
        }MB`,
      );
    }
  }

  private uploadBuffer(
    buffer: Buffer,
    options: UploadApiOptions,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (uploadErr, result) => {
          if (uploadErr || !result) {
            return reject(
              uploadErr instanceof Error
                ? uploadErr
                : new Error('Cloudinary upload failed'),
            );
          }

          resolve(result);
        },
      );

      Readable.from(buffer).pipe(stream);
    });
  }

  private handleUploadError(err: unknown, type: string): never {
    const message = err instanceof Error ? err.message : 'Unknown error';
    this.logger.error(`Upload ${type} failed`, message);
    throw new BadRequestException(`Upload ${type} thất bại: ${message}`);
  }
}
