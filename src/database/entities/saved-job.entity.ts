// src/database/entities/saved-job.entity.ts

import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Candidate } from './candidate.entity';
import { Job } from './job.entity';

@Entity('saved_jobs')
export class SavedJob {
  // Composite Primary Key
  @PrimaryColumn({ type: 'bigint', name: 'candidate_id' })
  candidateId: string;

  @PrimaryColumn({ type: 'bigint', name: 'job_id' })
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
