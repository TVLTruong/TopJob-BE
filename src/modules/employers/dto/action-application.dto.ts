// src/modules/employers/dto/action-application.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

/**
 * Application Action Enum
 * Actions that employer can take on an application
 */
export enum ApplicationAction {
  SHORTLIST = 'shortlist',
  REJECT = 'reject',
}

/**
 * Action Application Param DTO
 * Used for PATCH /employer/applications/:id/{action}
 */
export class ActionApplicationParamDto {
  @ApiProperty({
    description: 'Action to perform on the application',
    enum: ApplicationAction,
    example: ApplicationAction.SHORTLIST,
  })
  @IsEnum(ApplicationAction, {
    message: 'Action phải là shortlist hoặc reject',
  })
  action: ApplicationAction;
}

/**
 * Update Application Status Response DTO
 */
export class UpdateApplicationStatusResponseDto {
  @ApiProperty({
    description: 'ID của đơn ứng tuyển',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: 'Trạng thái mới của đơn ứng tuyển',
    example: 'shortlisted',
  })
  status: string;

  @ApiProperty({
    description: 'Thời gian cập nhật trạng thái',
    example: '2025-12-16T10:30:00Z',
  })
  statusUpdatedAt: Date;

  @ApiProperty({
    description: 'Thông báo',
    example: 'Đã cập nhật trạng thái đơn ứng tuyển thành công',
  })
  message: string;
}
