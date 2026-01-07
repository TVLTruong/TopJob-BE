// src/modules/admin-job-management/dto/update-job-status.dto.ts

import { IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../../../common/enums';

/**
 * DTO for updating job status
 */
export class UpdateJobStatusDto {
  @ApiProperty({
    description: 'New job status',
    enum: JobStatus,
    example: JobStatus.ACTIVE,
  })
  @IsEnum(JobStatus, { message: 'Status không hợp lệ' })
  status: JobStatus;
}

/**
 * DTO for toggling job hot status
 */
export class ToggleJobHotDto {
  @ApiProperty({
    description: 'Set job as hot or not',
    example: true,
  })
  @IsBoolean({ message: 'isHot phải là boolean' })
  isHot: boolean;
}
