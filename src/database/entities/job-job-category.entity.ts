// src/database/entities/job-job-category.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Job } from './job.entity';
import { JobCategory } from './job-category.entity';

/**
 * Job-JobCategory Entity
 * Junction table for many-to-many relationship between jobs and job categories
 * Allows a job to belong to multiple categories
 */
@Entity('job_job_categories')
@Index(['jobId', 'categoryId'], { unique: true })
export class JobJobCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'job_id' })
  @Index()
  jobId: string;

  @Column({ type: 'bigint', name: 'category_id' })
  @Index()
  categoryId: string;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary: boolean; // true for the main category of the job

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Job, (job) => job.jobCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => JobCategory, (category) => category.jobJobCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: JobCategory;
}
