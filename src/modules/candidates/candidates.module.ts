import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Candidate,
  CandidateCv,
  User,
  SavedJob,
  Job,
  Application,
} from '../../database/entities';
import { StorageModule } from '../storage/storage.module';
import {
  CandidateProfileService,
  CandidateCvService,
  CandidateJobService,
} from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Candidate,
      CandidateCv,
      User,
      SavedJob,
      Job,
      Application,
    ]),
    StorageModule,
  ],
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    CandidateProfileService,
    CandidateCvService,
    CandidateJobService,
  ],
  exports: [CandidatesService],
})
export class CandidatesModule {}
