// src/modules/jobs/dto/job-identifier.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Job Identifier
 * Accepts both numeric ID or slug string
 * Used for: GET /api/jobs/:identifier
 */
export class JobIdentifierDto {
  @ApiProperty({
    description: 'Job ID (numeric) hoặc Job Slug (string)',
    example: 'senior-fullstack-developer-123',
    examples: {
      slug: {
        value: 'senior-fullstack-developer-123',
        summary: 'Job Slug',
      },
      id: {
        value: '1',
        summary: 'Job ID',
      },
    },
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;
}
