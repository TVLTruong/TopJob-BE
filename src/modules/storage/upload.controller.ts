// src/modules/storage/upload.controller.ts

import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Express } from 'express';

import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards';
import { UploadResponseDto } from './dto';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  /* -------------------------------------------------------------------------- */
  /*                               Helper method                                */
  /* -------------------------------------------------------------------------- */

  private buildUploadResponse(
    url: string,
    file: Express.Multer.File,
  ): UploadResponseDto {
    return {
      url,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /* -------------------------------------------------------------------------- */
  /*                              Company logo                                  */
  /* -------------------------------------------------------------------------- */

  @Post('company-logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload logo công ty',
    description: 'Upload logo công ty lên Cloudinary và trả về URL',
  })
  @ApiBody({
    description: 'File logo (jpg, png, gif, webp - max 5MB)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload thành công',
    type: UploadResponseDto,
  })
  async uploadCompanyLogo(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    const { url } = await this.storageService.uploadCompanyLogo(file);
    return this.buildUploadResponse(url, file);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Company cover                                 */
  /* -------------------------------------------------------------------------- */

  @Post('company-cover')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadCompanyCover(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    const { url } = await this.storageService.uploadCompanyCover(file);
    return this.buildUploadResponse(url, file);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Candidate avatar                                */
  /* -------------------------------------------------------------------------- */

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    const { url } = await this.storageService.uploadCandidateAvatar(file);
    return this.buildUploadResponse(url, file);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   CV                                       */
  /* -------------------------------------------------------------------------- */

  @Post('cv')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadCV(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    const { url } = await this.storageService.uploadCV(file);
    return this.buildUploadResponse(url, file);
  }
}
