// src/modules/admin-employer-approval/dto/query-employer.dto.ts

import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployerStatus, EmployerProfileStatus } from '../../../common/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryEmployerDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: EmployerStatus,
    description: 'Lọc theo trạng thái nhà tuyển dụng',
    example: EmployerStatus.PENDING_APPROVAL,
  })
  @IsOptional()
  @IsEnum(EmployerStatus)
  status?: EmployerStatus;

  @ApiPropertyOptional({
    enum: EmployerProfileStatus,
    description: 'Lọc theo trạng thái hồ sơ nhà tuyển dụng',
    example: EmployerProfileStatus.PENDING_EDIT_APPROVAL,
  })
  @IsOptional()
  @IsEnum(EmployerProfileStatus)
  profileStatus?: EmployerProfileStatus;
}
