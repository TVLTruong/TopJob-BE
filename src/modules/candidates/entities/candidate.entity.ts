import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import User Entity

// Định nghĩa ENUM cho gender (dựa theo SQL của bạn)
export enum CandidateGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('candidates') // Tên bảng là 'candidates'
export class Candidate {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL PRIMARY KEY
  id: number;

  // --- Mối quan hệ 1-1 với User ---
  // user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE
  @OneToOne(() => User, (user) => user.candidate, {
    onDelete: 'CASCADE', // Tự động xóa candidate nếu user bị xóa
  })
  @JoinColumn({ name: 'user_id' }) // Tên cột khóa ngoại là 'user_id'
  user: User;
  // ---------------------------------

  // full_name VARCHAR(255) NOT NULL
  @Column({ name: 'full_name' })
  fullName: string;

  // gender VARCHAR(10) CHECK (...)
  @Column({
    type: 'enum',
    enum: CandidateGender,
    nullable: true,
  })
  gender: CandidateGender;

  // date_of_birth DATE NULL
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  // phone_number VARCHAR(20) NULL
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  // avatar_url TEXT NULL
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  // cv_url TEXT NULL
  @Column({ name: 'cv_url', type: 'text', nullable: true })
  cvUrl: string;

  // bio TEXT NULL
  @Column({ type: 'text', nullable: true })
  bio: string;

  // personal_url TEXT NULL
  @Column({ name: 'personal_url', type: 'text', nullable: true })
  personalUrl: string;

  // --- Các trường địa chỉ ---
  @Column({ name: 'address_street', nullable: true })
  addressStreet: string;

  @Column({ name: 'address_district', nullable: true })
  addressDistrict: string;

  @Column({ name: 'address_city', nullable: true })
  addressCity: string;

  @Column({ name: 'address_country', nullable: true })
  addressCountry: string;
  // ---------------------------

  // experience_years INT DEFAULT 0
  @Column({ name: 'experience_years', default: 0 })
  experienceYears: number;

  // education_level VARCHAR(100) NULL
  @Column({ name: 'education_level', nullable: true })
  educationLevel: string;

  // created_at TIMESTAMP DEFAULT NOW()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // updated_at TIMESTAMP DEFAULT NOW()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}