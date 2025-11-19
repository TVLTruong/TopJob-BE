// src/common/dto/pagination-response.dto.ts
import { IsArray, IsInt } from 'class-validator';

export class PaginationResponseDto<T> {
  @IsArray()
  data: T[]; // (Mảng chứa 'jobs' hoặc 'companies')

  @IsInt()
  total: number; // (Tổng số lượng)

  @IsInt()
  page: number;

  @IsInt()
  limit: number;

  @IsInt()
  totalPages: number;
}