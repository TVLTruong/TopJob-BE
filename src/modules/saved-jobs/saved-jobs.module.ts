import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedJobsController } from './saved-jobs.controller';
import { SavedJobsService } from './saved-jobs.service';
import { SavedJob } from '../../database/entities/saved-job.entity';
import { Job } from '../../database/entities/job.entity';
import { Candidate } from '../../database/entities/candidate.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

@Module({
  imports: [TypeOrmModule.forFeature([SavedJob, Job, Candidate]), AuthModule],
  controllers: [SavedJobsController],
  providers: [SavedJobsService, JwtAuthGuard, RolesGuard],
})
export class SavedJobsModule {}
