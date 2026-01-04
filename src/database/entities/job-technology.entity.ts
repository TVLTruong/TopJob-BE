// src/database/entities/job-technology.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * JobTechnology Junction Entity
 * Represents many-to-many relationship between Job and Technology
 */
@Entity('job_technologies')
@Index(['jobId', 'technologyId'], { unique: true })
@Index(['jobId'])
@Index(['technologyId'])
export class JobTechnology {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'job_id' })
  jobId: string;

  @Column({ type: 'bigint', name: 'technology_id' })
  technologyId: string;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne('Job', 'jobTechnologies', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: any;

  @ManyToOne('Technology', 'jobTechnologies', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'technology_id' })
  technology: any;
}
