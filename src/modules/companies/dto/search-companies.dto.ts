// src/modules/companies/dto/search-companies.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto'; // (Dùng 'tool' chung)

export class SearchCompaniesDto extends PaginationDto {
  // (Dịch từ Bước 3: "Tìm kiếm (theo Tên công ty)")
  @IsOptional()
  @IsString()
  q?: string; // (Từ khóa)

  // (Dịch từ Bước 3: "bộ lọc (theo Tỉnh/Thành)")
  @IsOptional()
  @IsString()
  location?: string; // (Chúng ta sẽ dùng Tỉnh/Thành slug)

  // (Dịch từ Bước 3: "Ngành nghề")
  @IsOptional()
  @IsString()
  industry?: string; // (Chúng ta sẽ dùng Ngành nghề slug)
}