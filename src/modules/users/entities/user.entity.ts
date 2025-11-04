import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Employer } from '../../employers/entities/employer.entity';
import { EmailVerificationToken } from '../../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

@Entity('users') // Tên bảng là 'users'
export class User {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL PRIMARY KEY
  id: number;

  @Column({ unique: true }) // email VARCHAR(255) UNIQUE NOT NULL
  email: string;

  @Column({ name: 'password_hash' }) // password_hash VARCHAR(255) NOT NULL
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CANDIDATE,
  }) // role VARCHAR(20) NOT NULL CHECK (...)
  role: UserRole;

  @Column({ name: 'is_verified', default: false }) // is_verified BOOLEAN DEFAULT FALSE
  isVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  }) // status VARCHAR(20) DEFAULT 'pending' CHECK (...)
  status: UserStatus;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true }) // email_verified_at TIMESTAMP NULL
  emailVerifiedAt: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true }) // last_login_at TIMESTAMP NULL
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- 🚀 QUAN HỆ (SẼ BÁO LỖI NẾU CHƯA TẠO FILE) ---
  // (Chúng ta sẽ tạo các file Entity kia sau)

  @OneToOne(() => Candidate, (candidate) => candidate.user)
  candidate: Candidate;

  @OneToOne(() => Employer, (employer) => employer.user)
  employer: Employer;

  @OneToMany(() => EmailVerificationToken, (token) => token.user)
  emailVerificationTokens: EmailVerificationToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens: PasswordResetToken[];
}