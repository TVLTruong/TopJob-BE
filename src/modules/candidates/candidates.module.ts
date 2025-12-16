import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 1. IMPORT
import { Candidate } from './entities/candidate.entity'; // 👈 2. IMPORT

@Module({
  imports: [TypeOrmModule.forFeature([Candidate])], // 👈 3. THÊM VÀO ĐÂY
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService], // 👈 4. Export service này
})
export class CandidatesModule {}