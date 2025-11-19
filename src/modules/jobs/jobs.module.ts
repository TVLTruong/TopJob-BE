// src/modules/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../database/database.module'; // 👈 (Import "Bảng mạch" DB)
import { Job } from '../../database/entities/job.entity'; // 👈 Import "Bản thiết kế"
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    DatabaseModule, // 👈 (Nối "Bảng mạch")
    TypeOrmModule.forFeature([Job]), // 👈 "Đăng ký" Entity
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService], // 👈 "Xuất" (Export) Service này
})
export class JobsModule {}