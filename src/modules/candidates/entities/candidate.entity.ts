import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';
import { SavedJob } from '../../saved-jobs/entities/saved-job.entity';

export enum CandidateGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL PRIMARY KEY
  id: number;

  @OneToOne(() => User, (user) => user.candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // user_id BIGINT UNIQUE REFERENCES...
  user: User;

  @Column({ name: 'full_name' }) // full_name VARCHAR(255) NOT NULL
  fullName: string;

  @Column({ type: 'enum', enum: CandidateGender, nullable: true }) // gender VARCHAR(10) CHECK (...)
  gender: CandidateGender;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true }) // date_of_birth DATE NULL
  dateOfBirth: Date;

  @Column({ name: 'phone_number', nullable: true }) // phone_number VARCHAR(20) NULL
  phoneNumber: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true }) // avatar_url TEXT NULL
  avatarUrl: string;

  @Column({ name: 'cv_url', type: 'text', nullable: true }) // cv_url TEXT NULL
  cvUrl: string;

  @Column({ type: 'text', nullable: true }) // bio TEXT NULL
  bio: string;

  @Column({ name: 'personal_url', type: 'text', nullable: true }) // personal_url TEXT NULL
  personalUrl: string;

  @Column({ name: 'address_street', nullable: true }) // address_street VARCHAR(255)
  addressStreet: string;

  @Column({ name: 'address_district', nullable: true }) // address_district VARCHAR(100)
  addressDistrict: string;

  @Column({ name: 'address_city', nullable: true }) // address_city VARCHAR(100)
  addressCity: string;

  @Column({ name: 'address_country', nullable: true }) // address_country VARCHAR(100)
  addressCountry: string;

  @Column({ name: 'experience_years', default: 0 }) // experience_years INT DEFAULT 0
  experienceYears: number;

  @Column({ name: 'education_level', nullable: true }) // education_level VARCHAR(100) NULL
  educationLevel: string;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- Quan hệ ---
  @OneToMany(() => Application, (app) => app.candidate)
  applications: Application[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.candidate)
  savedJobs: SavedJob[];
}