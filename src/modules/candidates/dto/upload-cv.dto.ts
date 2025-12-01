// src/modules/candidates/dto/upload-cv.dto.ts

import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/**
 * DTO for uploading CV
 * UC-CAN-02: Upload CV
 */
export class UploadCvDto {
  @ApiProperty({
    description: 'Tên file CV',
    example: 'my-resume.pdf',
  })
  @IsNotEmpty({ message: 'Tên file không được để trống' })
  @IsString({ message: 'Tên file phải là chuỗi' })
  fileName: string;

  @ApiProperty({
    description: 'URL của file CV (sau khi upload lên cloud storage)',
    example: 'https://cloudinary.com/abc123/my-resume.pdf',
  })
  @IsNotEmpty({ message: 'URL file không được để trống' })
  @IsString({ message: 'URL file phải là chuỗi' })
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Kích thước file (bytes)',
    example: 1024000,
  })
  @IsOptional()
  @Type(() => Number)
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Đặt làm CV mặc định',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'isDefault phải là boolean' })
  isDefault?: boolean;
}

/**
 * DTO for setting default CV
 */
export class SetDefaultCvDto {
  @ApiProperty({
    description: 'ID của CV cần đặt làm mặc định',
    example: '1',
  })
  @IsNotEmpty({ message: 'ID CV không được để trống' })
  @IsString({ message: 'ID CV phải là chuỗi' })
  cvId: string;
}
