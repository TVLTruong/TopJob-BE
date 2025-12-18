// src/modules/candidates/dto/upload-avatar-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for avatar upload
 */
export class UploadAvatarResponseDto {
  @ApiProperty({
    description: 'URL của avatar đã upload',
    example:
      'https://res.cloudinary.com/demo/image/upload/v1234567890/topjob/avatars/abc123.jpg',
  })
  avatarUrl: string;
}
