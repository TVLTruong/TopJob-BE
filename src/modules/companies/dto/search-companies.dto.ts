// src/modules/companies/dto/search-companies.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
// import { CompanySize } from '../../../common/enums';

/**
 * DTO for Public Company Search (Guest/Candidate)
 * UC-GUEST-04: Tìm kiếm công ty
 */
export class SearchCompaniesDto extends PaginationDto {
  /**
   * Từ khóa tìm kiếm (company name)
   * @example "Tech Company"
   */
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm trong tên công ty',
    example: 'Tech Company',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  /**
   * Lọc theo city/province
   * @example "Hồ Chí Minh"
   */
  @ApiPropertyOptional({
    description: 'Lọc theo tỉnh/thành phố',
    example: 'Hồ Chí Minh',
  })
  @IsOptional()
  @IsString()
  city?: string;

  /**
   * Lọc theo industry (ngành nghề)
   * @example "Information Technology"
   */
  @ApiPropertyOptional({
    description: 'Lọc theo ngành nghề',
    example: 'Information Technology',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  // /**
  //  * Lọc theo quy mô công ty
  //  * @example "medium"
  //  */
  // @ApiPropertyOptional({
  //   description: 'Lọc theo quy mô công ty',
  //   enum: CompanySize,
  //   example: CompanySize.MEDIUM,
  // })
  // @IsOptional()
  // @IsEnum(CompanySize)
  // companySize?: CompanySize;
}
