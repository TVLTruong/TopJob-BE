// src/common/dto/pagination-meta.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  limit: number;

  @ApiProperty({ example: 120 })
  @IsInt()
  total: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  totalPages: number;
}
