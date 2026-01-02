// src/database/entities/job.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import {
  JobStatus,
  JobType,
  ExperienceLevel,
  WorkMode,
} from '../../common/enums';
import { Employer } from './employer.entity';
import { JobCategory } from './job-category.entity';
import { EmployerLocation } from './employer-location.entity';
import { Application } from './application.entity';
import { SavedJob } from './saved-job.entity';

/**
 * Job Entity
 * Represents a job posting created by an employer
 */
@Entity('jobs')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['expiredAt'])
@Index(['employerId'])
@Index(['locationId'])
export class Job {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  // employer
  @Column({ type: 'bigint', name: 'employer_id' })
  @Index()
  employerId: string;

  @ManyToOne(() => Employer, (employer) => employer.jobs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  // category
  @Column({ type: 'bigint', name: 'category_id' })
  @Index()
  categoryId: string;

  @ManyToOne(() => JobCategory, (category) => category.jobs)
  @JoinColumn({ name: 'category_id' })
  category: JobCategory;

  // location
  @Column({ type: 'bigint', name: 'location_id' })
  @Index()
  locationId: string;

  @ManyToOne(() => EmployerLocation, (location) => location.jobs)
  @JoinColumn({ name: 'location_id' })
  location: EmployerLocation;

  // Core Job Info
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  responsibilities: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  requirements: string[] | null;

  @Column({ type: 'text', array: true, nullable: true, name: 'nice_to_have' })
  niceToHave: string[] | null;

  @Column('text', { array: true, nullable: true })
  benefits: string[] | null;

  // JOb Attributes
  @Column({ type: 'enum', enum: JobType })
  employmentType: JobType;

  @Column({ type: 'enum', enum: WorkMode })
  workMode: WorkMode;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'int', nullable: true })
  experienceYearsMin: number;

  @Column({ type: 'enum', enum: ExperienceLevel, nullable: true })
  experienceLevel: ExperienceLevel | null;

  // Salary
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'salary_min',
  })
  salaryMin: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'salary_max',
  })
  salaryMax: number | null;

  @Column({ type: 'boolean', default: false })
  isNegotiable: boolean;

  @Column({ type: 'boolean', default: true })
  isSalaryVisible: boolean;

  @Column({ length: 10, default: 'VND' })
  salaryCurrency: string;

  // Status & Time
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.DRAFT,
  })
  @Index()
  status: JobStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date | null;

  // Statistics
  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  applyCount: number;

  @Column({ type: 'int', default: 0 })
  saveCount: number;

  // Flags
  @Column({ type: 'boolean', default: false, name: 'is_hot' })
  isHot: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_urgent' })
  isUrgent: boolean;

  // Timestamps
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at' })
  deletedAt: Date;

  // Relations
  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.job)
  savedJobs: SavedJob[];
}
