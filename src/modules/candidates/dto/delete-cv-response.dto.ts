// src/modules/candidates/dto/delete-cv-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for CV deletion
 */
export class DeleteCvResponseDto {
  @ApiProperty({
    description: 'Thông báo thành công',
    example: 'Đã xóa CV thành công',
  })
  message: string;

  @ApiProperty({
    description: 'ID của CV đã bị xóa',
    example: '123',
  })
  deletedCvId: string;
}
