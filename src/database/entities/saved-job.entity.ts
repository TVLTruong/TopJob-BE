// src/database/entities/saved-job.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Candidate } from './candidate.entity';
import { Job } from './job.entity';

@Entity('saved_jobs')
@Unique(['candidateId', 'jobId'])
export class SavedJob {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'candidate_id' })
  @Index()
  candidateId: string;

  @Column({ type: 'bigint', name: 'job_id' })
  @Index()
  jobId: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'saved_at',
  })
  savedAt: Date;

  // Relations
  @ManyToOne(() => Candidate, (candidate) => candidate.savedJobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @ManyToOne(() => Job, (job) => job.savedJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;
}
