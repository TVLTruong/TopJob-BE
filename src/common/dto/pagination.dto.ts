// src/common/dto/pagination.dto.ts
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number) // 👈 Tự động chuyển 'string' (từ URL) sang 'number'
  @IsInt()
  @Min(1)
  page?: number = 1; // 👈 Định nghĩa 'page'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10; // 👈 Định nghĩa 'limit'
}
