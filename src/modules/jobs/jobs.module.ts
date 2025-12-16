// src/modules/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../database/database.module'; // 👈 (Import "Bảng mạch" DB)
import {
  Job,
  Employer,
  EmployerLocation,
  Application,
} from '../../database/entities';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { EmployerJobsController } from './employer-jobs.controller';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

@Module({
  imports: [
    DatabaseModule, // 👈 (Nối "Bảng mạch")
    TypeOrmModule.forFeature([Job, Employer, EmployerLocation, Application]), // 👈 "Đăng ký" Entity
  ],
  controllers: [JobsController, EmployerJobsController],
  providers: [JobsService, JwtAuthGuard, RolesGuard],
  exports: [JobsService], // 👈 "Xuất" (Export) Service này
})
export class JobsModule { }