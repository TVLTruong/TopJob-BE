// src/modules/candidates/dto/apply-job-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for job application
 */
export class ApplyJobResponseDto {
  @ApiProperty({
    description: 'Thông báo thành công',
    example: 'Ứng tuyển thành công',
  })
  message: string;

  @ApiProperty({
    description: 'ID của đơn ứng tuyển đã tạo',
    example: '123',
  })
  applicationId: string;
}
