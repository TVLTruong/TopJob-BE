// src/modules/admin-candidate-management/dto/update-candidate.dto.ts

import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for admin to update candidate basic information
 * Only allows updating non-system fields
 */
export class UpdateCandidateDto {
  @ApiPropertyOptional({
    description: 'Tên đầy đủ của ứng viên',
    example: 'Nguyễn Văn A',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Tên không được vượt quá 255 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại',
    example: '0123456789',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Số điện thoại không được vượt quá 20 ký tự' })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'URL avatar',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Avatar phải là URL hợp lệ' })
  avatarUrl?: string;
}
