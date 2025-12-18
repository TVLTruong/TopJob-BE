// src/modules/candidates/dto/set-default-cv-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for setting default CV
 */
export class SetDefaultCvResponseDto {
  @ApiProperty({
    description: 'Thông báo thành công',
    example: 'Đã đặt CV làm mặc định',
  })
  message: string;

  @ApiProperty({
    description: 'ID của CV đã được đặt làm mặc định',
    example: '123',
  })
  cvId: string;
}
