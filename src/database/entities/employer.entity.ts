// src/database/entities/employer.entity.ts

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
import {
  EmployerStatus,
  EmployerProfileStatus,
  CompanySize,
} from '../../common/enums';
import { User } from './user.entity';
import { EmployerLocation } from './employer-location.entity';
import { EmployerPendingEdit } from './employer-pending-edit.entity';
import { Job } from './job.entity';

/**
 * Employer Entity
 * Stores employer/company profile information
 * Use Cases: UCEMP01-02, UCADM01
 */
@Entity('employers')
@Index(['userId'])
@Index(['status'])
@Index(['companyName'])
export class Employer {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', unique: true, name: 'user_id' })
  userId: string;

  // Contact Person Info
  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 255, name: 'work_title', nullable: true })
  workTitle: string | null;

  // Company Info
  @Column({ type: 'varchar', length: 255, name: 'company_name' })
  @Index()
  companyName: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  website: string | null;

  // @Column({ type: 'varchar', length: 50, nullable: true, name: 'tax_code' })
  // taxCode: string | null;

  // Company Media
  @Column({ type: 'text', nullable: true, name: 'logo_url' })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true, name: 'cover_image_url' })
  coverImageUrl: string | null;

  // Company Details
  @Column({ type: 'int', nullable: true, name: 'founded_year' })
  foundedYear: number | null;

  @Column({
    type: 'enum',
    enum: CompanySize,
    nullable: true,
    name: 'company_size',
  })
  companySize: CompanySize | null;

  // Contact Info
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'contact_email',
  })
  contactEmail: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'contact_phone',
  })
  contactPhone: string | null;

  @Column({ type: 'text', nullable: true })
  linkedlnUrl: string | null;

  @Column({ type: 'text', nullable: true })
  facebookUrl: string | null;

  @Column({ type: 'text', nullable: true })
  xUrl: string | null;

  // Status Fields
  @Column({ type: 'boolean', default: false, name: 'is_approved' })
  isApproved: boolean;

  @Column({
    type: 'enum',
    enum: EmployerStatus,
    default: EmployerStatus.PENDING_APPROVAL,
  })
  @Index()
  status: EmployerStatus;

  @Column({
    type: 'enum',
    enum: EmployerProfileStatus,
    default: EmployerProfileStatus.APPROVED,
    name: 'profile_status',
  })
  profileStatus: EmployerProfileStatus;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
  })
  benefits: string[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.employer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => EmployerLocation, (location) => location.employer, {
    cascade: true,
  })
  locations: EmployerLocation[];

  @OneToMany(() => EmployerPendingEdit, (edit) => edit.employer)
  pendingEdits: EmployerPendingEdit[];

  @OneToMany(() => Job, (job) => job.employer)
  jobs: Job[];

  // Virtual methods
  isActive(): boolean {
    return this.status === EmployerStatus.ACTIVE;
  }

  isPendingApproval(): boolean {
    return this.status === EmployerStatus.PENDING_APPROVAL;
  }

  hasPendingEdits(): boolean {
    return this.profileStatus === EmployerProfileStatus.PENDING_EDIT_APPROVAL;
  }

  getHeadquarters(): EmployerLocation | undefined {
    return this.locations?.find((loc) => loc.isHeadquarters);
  }

  getCompanyAge(): number | null {
    if (!this.foundedYear) return null;
    return new Date().getFullYear() - this.foundedYear;
  }

  hasCompleteProfile(): boolean {
    return !!(
      this.companyName &&
      this.description &&
      this.logoUrl &&
      this.locations?.length > 0
    );
  }
}
