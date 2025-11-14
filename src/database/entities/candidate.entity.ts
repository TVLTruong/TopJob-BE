// src/database/entities/candidate.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Gender, EducationLevel, ExperienceLevel } from '../../common/enums';
import { User } from './user.entity';
import { CandidateCv } from './candidate-cv.entity';
import { Application } from './application.entity';
import { SavedJob } from './saved-job.entity';

/**
 * Candidate Entity
 * Stores candidate profile information
 * Use Cases: UCCAN01
 */
@Entity('candidates')
@Index(['userId'])
export class Candidate {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', unique: true, name: 'user_id' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'full_name',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  fullName: string;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender | null;

  @Column({
    type: 'date',
    nullable: true,
    name: 'date_of_birth',
  })
  dateOfBirth: Date | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'phone_number',
  })
  phoneNumber: string | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'avatar_url',
  })
  avatarUrl: string | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'bio',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  bio: string | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'personal_url',
  })
  personalUrl: string | null;

  // Address Fields
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'address_street',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  addressStreet: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'address_district',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  addressDistrict: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'address_city',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  addressCity: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'Vietnam',
    name: 'address_country',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  addressCountry: string;

  // Experience & Education
  @Column({ type: 'int', default: 0, name: 'experience_years' })
  experienceYears: number;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
    name: 'experience_level',
  })
  experienceLevel: ExperienceLevel | null;

  @Column({
    type: 'enum',
    enum: EducationLevel,
    nullable: true,
    name: 'education_level',
  })
  educationLevel: EducationLevel | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.candidate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => CandidateCv, (cv) => cv.candidate, { cascade: true })
  cvs: CandidateCv[];

  @OneToMany(() => Application, (application) => application.candidate)
  applications: Application[];

  @OneToMany(() => SavedJob, (savedJob) => savedJob.candidate)
  savedJobs: SavedJob[];

  // Virtual methods
  getFullAddress(): string {
    const parts = [
      this.addressStreet,
      this.addressDistrict,
      this.addressCity,
      this.addressCountry,
    ].filter(Boolean);
    return parts.join(', ');
  }

  hasCV(): boolean {
    return this.cvs && this.cvs.length > 0;
  }

  getDefaultCV(): CandidateCv | undefined {
    return this.cvs?.find((cv) => cv.isDefault);
  }

  getAge(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
}
