import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum'; // 👈 Import
import { UserStatus } from '../../../common/enums/user-status.enum'; // 👈 Import
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Employer } from '../../employers/entities/employer.entity';
import { EmailVerificationToken } from '../../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

@Entity('users') // Tên bảng là 'users'
export class User {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL PRIMARY KEY
  id: number; // 👈 Sửa: từ 'string' (uuid) sang 'number'

  @Column({ unique: true }) // email VARCHAR(255) UNIQUE NOT NULL
  email: string;

  @Column({ name: 'password_hash' }) // password_hash VARCHAR(255) NOT NULL
  passwordHash: string; // 👈 Sửa: Đổi tên (từ 'password_hash' hoặc 'password')

  @Column({
    type: 'enum',
    enum: UserRole, // 👈 Dùng Enum
    default: UserRole.CANDIDATE,
  }) // role VARCHAR(20) NOT NULL CHECK (...)
  role: UserRole;

  @Column({ name: 'is_verified', default: false }) // is_verified BOOLEAN DEFAULT FALSE
  isVerified: boolean; // 👈 Sửa: Đổi tên (từ 'is_verified')

  @Column({
    type: 'enum',
    enum: UserStatus, // 👈 Dùng Enum
    default: UserStatus.PENDING,
  }) // status VARCHAR(20) DEFAULT 'pending' CHECK (...)
  status: UserStatus;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date | null; // 👈 Sửa: Đổi tên

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null; // 👈 Sửa: Đổi tên

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date | null; // 👈 Sửa: Đổi tên

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date; // 👈 Sửa: Đổi tên

  // --- 🚀 QUAN HỆ (Sẽ báo lỗi nếu chưa tạo file entity khác) ---
  @OneToOne(() => Candidate, (candidate) => candidate.user)
  candidate: Candidate;

  @OneToOne(() => Employer, (employer) => employer.user)
  employer: Employer;

  @OneToMany(() => EmailVerificationToken, (token) => token.user)
  emailVerificationTokens: EmailVerificationToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens: PasswordResetToken[];
}