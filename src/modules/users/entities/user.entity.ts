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
// import { Employer } from '../../employers/entities/employer.entity';
import { OtpVerification } from '../../auth/entities/otp-verification.entity';
// import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';

@Entity('users') // Tên bảng là 'users'
export class User {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL PRIMARY KEY
  id: number; // 👈 Sửa: từ 'string' (uuid) sang 'number'

  @Column({ unique: true }) // email VARCHAR(255) UNIQUE NOT NULL
  email: string;

  @Column({ name: 'password_hash' }) // password_hash VARCHAR(255) NOT NULL
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole, // 👈 Dùng Enum
    default: UserRole.CANDIDATE,
  }) // role VARCHAR(20) NOT NULL CHECK (...)
  role: UserRole;

  @Column({ name: 'is_verified', default: false }) // is_verified BOOLEAN DEFAULT FALSE
  is_verified: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus, // 👈 Dùng Enum
    default: UserStatus.PENDING,
  }) // status VARCHAR(20) DEFAULT 'pending' CHECK (...)
  status: UserStatus;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true }) // email_verified_at TIMESTAMP NULL
  email_verified_at: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true }) // last_login_at TIMESTAMP NULL
  last_login_at: Date | null;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date | null; // 👈 Sửa: Đổi tên

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // ---  QUAN HỆ (SẼ BÁO LỖI NẾU CHƯA TẠO FILE) ---
  // (Chúng ta sẽ tạo các file Entity kia sau)

  // --- 🚀 QUAN HỆ (Sẽ báo lỗi nếu chưa tạo file entity khác) ---
  @OneToOne(() => Candidate, (candidate) => candidate.user)
  candidate: Candidate;

  // @OneToOne(() => Employer, (employer) => employer.user)
  // employer: Employer;

  @OneToMany(() => OtpVerification, (otp) => otp.user)
  otpVerifications: OtpVerification[];

  //   @OneToMany(() => PasswordResetToken, (token) => token.user)
  //   passwordResetTokens: PasswordResetToken[];
}
