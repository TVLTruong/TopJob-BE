import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Employer } from '../../employers/entities/employer.entity';
import { JobCategory } from '../../job-categories/entities/job-category.entity';
import { EmployerLocation } from '../../employers/entities/employer-location.entity';
import { Application } from '../../applications/entities/application.entity';
import { SavedJob } from '../../saved-jobs/entities/saved-job.entity';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  @ManyToOne(() => Employer, (emp) => emp.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_id' }) // employer_id INT NOT NULL REFERENCES...
  employer: Employer;

  @ManyToOne(() => JobCategory, (cat) => cat.jobs, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' }) // category_id INT REFERENCES...
  category: JobCategory;

  @ManyToOne(() => EmployerLocation, (loc) => loc.jobs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'location_id' }) // location_id INT REFERENCES...
  location: EmployerLocation;

  @Column() // title VARCHAR(255) NOT NULL
  title: string;

  @Column({ unique: true }) // slug VARCHAR(255) UNIQUE NOT NULL
  slug: string;

  @Column({ type: 'text', nullable: true }) // description TEXT
  description: string;

  @Column({ type: 'text', nullable: true }) // requirements TEXT
  requirements: string;

  @Column({ name: 'nice_to_have', type: 'text', nullable: true }) // nice_to_have TEXT
  niceToHave: string;

  @Column({
    name: 'salary_min',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  }) // salary_min NUMERIC(12,2)
  salaryMin: number;

  @Column({
    name: 'salary_max',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  }) // salary_max NUMERIC(12,2)
  salaryMax: number;

  @Column({ name: 'salary_currency', nullable: true }) // salary_currency VARCHAR(10)
  salaryCurrency: string;

  @Column({ name: 'is_negotiable', default: false }) // is_negotiable BOOLEAN DEFAULT false
  isNegotiable: boolean;

  @Column({ name: 'location_text', nullable: true }) // location_text VARCHAR(255)
  locationText: string;

  @Column({ name: 'job_type', nullable: true }) // job_type VARCHAR(50)
  jobType: string;

  @Column({ name: 'experience_level', nullable: true }) // experience_level VARCHAR(50)
  experienceLevel: string;

  @Column({ name: 'positions_available', default: 1 }) // positions_available INT DEFAULT 1
  positionsAvailable: number;

  @Column({
    name: 'required_skills',
    type: 'text',
    array: true,
    nullable: true,
  }) // required_skills TEXT[]
  requiredSkills: string[];

  @Column({ type: 'text', array: true, nullable: true }) // benefits TEXT[]
  benefits: string[];

  @Column({ default: 'draft' }) // status VARCHAR(20) DEFAULT 'draft'
  status: string;

  @Column({ type: 'timestamp', nullable: true }) // deadline TIMESTAMP
  deadline: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true }) // published_at TIMESTAMP
  publishedAt: Date;

  @Column({ name: 'application_count', default: 0 }) // application_count INT DEFAULT 0
  applicationCount: number;

  @Column({ name: 'is_featured', default: false }) // is_featured BOOLEAN DEFAULT false
  isFeatured: boolean;

  @Column({ name: 'is_urgent', default: false }) // is_urgent BOOLEAN DEFAULT false
  isUrgent: boolean;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- Quan hệ ---
  @OneToMany(() => Application, (app) => app.job)
  applications: Application[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.job)
  savedJobs: SavedJob[];
}
