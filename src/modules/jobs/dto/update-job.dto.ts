// src/modules/jobs/dto/update-job.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {}
