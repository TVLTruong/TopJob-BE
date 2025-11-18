// src/modules/companies/companies.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '../../database/database.module'; // 👈 (Import "Bảng mạch" DB)
import { Employer } from '../../database/entities/employer.entity'; // 👈 Import "Bản thiết kế"
import { Job } from '../../database/entities/job.entity'; // 👈 Import "Bản thiết kế"
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [
    DatabaseModule, // 👈 (Nối "Bảng mạch")
    TypeOrmModule.forFeature([
      Employer, // 👈 "Đăng ký" Entity Cty
      Job,      // 👈 "Đăng ký" Entity Job
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}