// src/database/entities/job.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { JobStatus, JobType, ExperienceLevel } from '../../common/enums';
import { Employer } from './employer.entity';
import { JobCategory } from './job-category.entity';
import { EmployerLocation } from './employer-location.entity';
import { Application } from './application.entity';
import { SavedJob } from './saved-job.entity';

@Entity('jobs')
@Index(['status', 'deadline'])
@Index(['publishedAt'])
export class Job {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'employer_id' })
  @Index()
  employerId: string;

  @Column({ type: 'bigint', name: 'category_id' })
  @Index()
  categoryId: string;

  @Column({ type: 'bigint', name: 'location_id' })
  @Index()
  locationId: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'title',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  @Index()
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'description',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  description: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'requirements',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  requirements: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'responsibilities',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  responsibilities: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'nice_to_have',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  niceToHave: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'salary_min',
  })
  salaryMin: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'salary_max',
  })
  salaryMax: number;

  @Column({ type: 'boolean', default: false, name: 'is_negotiable' })
  isNegotiable: boolean;

  @Column({
    type: 'enum',
    enum: JobType,
    name: 'job_type',
  })
  jobType: JobType;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
    name: 'experience_level',
  })
  experienceLevel: ExperienceLevel;

  @Column({ type: 'int', default: 1, name: 'positions_available' })
  positionsAvailable: number;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'required_skills',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  requiredSkills: string[];

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.DRAFT,
  })
  @Index()
  status: JobStatus;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  deadline: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date;

  @Column({ type: 'int', default: 0, name: 'application_count' })
  applicationCount: number;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_urgent' })
  isUrgent: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Employer, (employer) => employer.jobs)
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  @ManyToOne(() => JobCategory, (category) => category.jobs)
  @JoinColumn({ name: 'category_id' })
  category: JobCategory;

  @ManyToOne(() => EmployerLocation, (location) => location.jobs)
  @JoinColumn({ name: 'location_id' })
  location: EmployerLocation;

  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.job)
  savedJobs: SavedJob[];
}
