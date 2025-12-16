// src/modules/jobs/dto/create-job-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../../../common/enums';

export class CreateJobResponseDto {
    @ApiProperty({ description: 'ID tin tuyển dụng' })
    jobId: string;

    @ApiProperty({ description: 'Trạng thái tin', enum: JobStatus })
    status: JobStatus;
}

