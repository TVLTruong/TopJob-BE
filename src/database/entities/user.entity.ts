// src/database/entities/user.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, UserStatus } from '../../common/enums';
import { Candidate } from './candidate.entity';
import { Employer } from './employer.entity';
import { ApprovalLog } from './approval-log.entity';
import { OtpVerification } from './otp-verification.entity';

/**
 * User Entity
 * Main authentication and authorization entity
 * Use Cases: UCREG01-03, UCAUTH01-03
 */
@Entity('users')
@Index(['email'])
@Index(['role', 'status'])
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  // @Index()
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude() // Exclude from JSON responses
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_EMAIL_VERIFICATION,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified_at' })
  emailVerifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Candidate, (candidate) => candidate.user, {
    cascade: true,
    eager: false,
  })
  candidate?: Candidate;

  @OneToOne(() => Employer, (employer) => employer.user, {
    cascade: true,
    eager: false,
  })
  employer?: Employer;

  // @OneToMany(() => Notification, (notification) => notification.user)
  // notifications?: Notification[];

  @OneToMany(() => ApprovalLog, (log) => log.admin)
  approvalLogs?: ApprovalLog[];

  @OneToMany(() => OtpVerification, (otp) => otp.user)
  otpVerifications: OtpVerification[];
  // Virtual methods
  isCandidate(): boolean {
    return this.role === UserRole.CANDIDATE;
  }

  isEmployer(): boolean {
    return this.role === UserRole.EMPLOYER;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  canLogin(): boolean {
    return this.isVerified && this.status !== UserStatus.BANNED;
  }
}
