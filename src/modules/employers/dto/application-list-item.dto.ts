// src/modules/employers/dto/application-list-item.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../../../common/enums';

/**
 * Application List Item DTO
 * Simplified version for list view
 */
export class ApplicationListItemDto {
  @ApiProperty({ description: 'Application ID', example: '1' })
  id: string;

  @ApiProperty({
    description: 'Trạng thái đơn ứng tuyển',
    enum: ApplicationStatus,
    example: ApplicationStatus.NEW,
  })
  status: ApplicationStatus;

  @ApiProperty({
    description: 'Thời gian nộp đơn',
    example: '2025-12-16T10:00:00Z',
  })
  appliedAt: Date;

  @ApiPropertyOptional({
    description: 'Thời gian cập nhật trạng thái',
    example: '2025-12-16T11:00:00Z',
  })
  statusUpdatedAt: Date | null;

  @ApiProperty({ description: 'Thông tin ứng viên' })
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
  };

  @ApiProperty({ description: 'Thông tin công việc' })
  job: {
    id: string;
    title: string;
    slug: string;
  };

  @ApiPropertyOptional({ description: 'Thông tin CV' })
  cv: {
    id: string;
    fileName: string;
    fileUrl: string;
  } | null;
}
