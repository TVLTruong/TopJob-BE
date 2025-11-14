// src/database/entities/application.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApplicationStatus } from '@/common/enums';
import { Candidate } from './candidate.entity';
import { Job } from './job.entity';
import { CandidateCv } from './candidate-cv.entity';

@Entity('applications')
@Unique(['candidateId', 'jobId'])
@Index(['status'])
@Index(['appliedAt'])
export class Application {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'candidate_id' })
  @Index()
  candidateId: string;

  @Column({ type: 'bigint', name: 'job_id' })
  @Index()
  jobId: string;

  @Column({ type: 'bigint', nullable: true, name: 'cv_id' })
  cvId: string;

  @Column({ type: 'text', nullable: true, name: 'cv_url' })
  cvUrl: string;

  @Column({ type: 'text', nullable: true, name: 'cover_letter' })
  coverLetter: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.NEW,
  })
  status: ApplicationStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'status_updated_at' })
  statusUpdatedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'employer_note' })
  employerNote: string;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'applied_at',
  })
  appliedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'interview_scheduled_at' })
  interviewScheduledAt: Date;

  @Column({ type: 'text', nullable: true, name: 'interview_notes' })
  interviewNotes: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Candidate, (candidate) => candidate.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => CandidateCv, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cv_id' })
  cv: CandidateCv;
}
