// src/modules/storage/dto/upload-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Upload Response DTO
 */
export class UploadResponseDto {
  @ApiProperty({
    description: 'URL của file đã upload',
    example:
      'https://res.cloudinary.com/demo/image/upload/v1234567890/topjob/logos/abc123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Tên file gốc',
    example: 'company-logo.png',
  })
  originalName: string;

  @ApiProperty({
    description: 'Kích thước file (bytes)',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'Loại file',
    example: 'image/png',
  })
  mimeType: string;
}
