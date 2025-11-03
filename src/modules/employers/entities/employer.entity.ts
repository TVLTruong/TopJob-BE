import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany, // 👈 Thêm
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CompanySize } from '../../../common/enums/company-size.enum';
import { EmployerLocation } from './employer-location.entity'; // 👈 Sẽ tạo ở file sau
// import { Job } from '../../jobs/entities/job.entity'; // 👈 (Sẽ dùng cho 'jobs')

@Entity('employers')
export class Employer {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL
  id: number;

  @OneToOne(() => User, (user) => user.employer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // user_id BIGINT UNIQUE REFERENCES...
  user: User;

  @Column({ name: 'company_name' }) // company_name VARCHAR(255) NOT NULL
  companyName: string;

  @Column({ name: 'work_title', nullable: true })
  workTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  website: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ name: 'founded_year', nullable: true })
  foundedYear: number;

  @Column({
    name: 'company_size',
    type: 'enum',
    enum: CompanySize,
    nullable: true,
  }) // company_size VARCHAR(50) NULL CHECK (...)
  companySize: CompanySize;

  @Column({ name: 'tax_code', unique: true, nullable: true })
  taxCode: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  // 2 trường này là địa chỉ chính (theo SQL của bạn)
  @Column({ name: 'address_city', nullable: true })
  addressCity: string;

  @Column({ name: 'address_country', nullable: true })
  addressCountry: string;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  }) // status VARCHAR(20) DEFAULT 'pending' CHECK (...)
  status: 'pending' | 'active' | 'banned';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // --- Quan hệ (phần bạn vừa thêm vào SQL) ---

  // 1. Quan hệ 1-Nhiều với Địa chỉ Văn phòng
  @OneToMany(() => EmployerLocation, (location) => location.employer)
  locations: EmployerLocation[];

  // 2. Quan hệ 1-Nhiều với Jobs (để sau này)
  // @OneToMany(() => Job, (job) => job.employer)
  // jobs: Job[];
}