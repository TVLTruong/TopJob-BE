// src/modules/admin-job-approval/dto/reject-job.dto.ts

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectJobDto {
  @ApiProperty({
    description: 'Lý do từ chối tin tuyển dụng (bắt buộc)',
    example: 'Nội dung công việc không rõ ràng',
    minLength: 10,
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Lý do từ chối là bắt buộc' })
  @IsString()
  @MinLength(10, { message: 'Lý do từ chối phải có ít nhất 10 ký tự' })
  @MaxLength(1000, { message: 'Lý do từ chối không được vượt quá 1000 ký tự' })
  reason: string;
}
