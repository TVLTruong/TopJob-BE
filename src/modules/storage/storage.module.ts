// src/modules/storage/storage.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards';

/**
 * Storage Module
 * Handles file uploads to Cloudinary
 */
@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [StorageService, JwtAuthGuard],
  exports: [StorageService],
})
export class StorageModule {}
