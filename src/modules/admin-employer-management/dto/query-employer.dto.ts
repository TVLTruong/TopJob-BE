// src/modules/admin-employer-management/dto/query-employer.dto.ts

import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../common/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryEmployerDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo email hoặc tên công ty',
    example: 'abc@example.com',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: 'Filter theo trạng thái user',
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
