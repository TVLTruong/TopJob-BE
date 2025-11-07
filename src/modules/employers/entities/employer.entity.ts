import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  // ManyToMany,
  // JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EmployerLocation } from './employer-location.entity';
// import { CompanyCategory } from '../../company-categories/entities/company-category.entity';
// import { Job } from '../../jobs/entities/job.entity';
import { UserStatus } from '../../../common/enums/user-status.enum';

@Entity('employers')
export class Employer {
  @PrimaryGeneratedColumn('increment') // id BIGSERIAL PRIMARY KEY
  id: number;

  @OneToOne(() => User, (user: User) => user.employer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // user_id BIGINT UNIQUE REFERENCES...
  user: User;

  @Column({ name: 'full_name' }) // full_name VARCHAR(255) NOT NULL
  fullName: string;

  @Column({ name: 'company_name' }) // company_name VARCHAR(255) NOT NULL
  companyName: string;

  @Column({ name: 'work_title', nullable: true }) // work_title VARCHAR(255) NULL
  workTitle: string;

  @Column({ type: 'text', nullable: true }) // description TEXT NULL
  description: string;

  @Column({ type: 'text' }) // website TEXT NULL
  website: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true }) // logo_url TEXT NULL
  logoUrl: string;

  @Column({ name: 'founded_year', nullable: true }) // founded_year INT NULL
  foundedYear: number;

  @Column({ name: 'contact_email', nullable: true }) // contact_email VARCHAR(255)
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true }) // contact_phone VARCHAR(20)
  contactPhone: string;

  @Column({ name: 'is_approved', default: false }) // is_approved BOOLEAN DEFAULT FALSE
  isApproved: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  }) // status VARCHAR(20) DEFAULT 'pending' CHECK (...)
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- Quan hệ ---
  @OneToMany(() => EmployerLocation, (loc) => loc.employer)
  locations: EmployerLocation[];

  // @OneToMany(() => Job, (job) => job.employer)
  // jobs: Job[];

  // // Bảng 6: employer_industries (n-n)
  // @ManyToMany(() => CompanyCategory, (cat) => cat.employers)
  // @JoinTable({
  //   name: 'employer_industries',
  //   joinColumn: { name: 'employer_id' },
  //   inverseJoinColumn: { name: 'category_id' },
  // })
  // industries: CompanyCategory[];
}
