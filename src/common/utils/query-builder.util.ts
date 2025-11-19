// src/common/utils/query-builder.util.ts
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationResponseDto } from '../dto/pagination-response.dto';

export async function createPaginationResponse<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  page: number = 1,
  limit: number = 10,
): Promise<PaginationResponseDto<T>> {
  const skip = (page - 1) * limit;

  const [data, total] = await queryBuilder
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}