// src/modules/admin-employer-approval/dto/query-employer.dto.ts

import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EmployerApprovalType } from '../../../common/enums';

export class QueryEmployerDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: EmployerApprovalType,
    description: 'Loại duyệt nhà tuyển dụng',
    example: EmployerApprovalType.ALL,
  })
  @IsOptional()
  @IsEnum(EmployerApprovalType)
  approvalType?: EmployerApprovalType;
}
