// src/modules/candidates/dto/toggle-saved-job-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for toggling saved job
 */
export class ToggleSavedJobResponseDto {
  @ApiProperty({
    description: 'Trạng thái đã lưu công việc',
    example: true,
  })
  saved: boolean;
}
