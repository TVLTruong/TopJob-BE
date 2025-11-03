import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
import { Employer } from 'src/modules/employers/entities/employer.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'candidate',
  })
  role: 'candidate' | 'employer' | 'admin';

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  status: 'pending' | 'active' | 'banned';

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  // --- Mối quan hệ 1-1 với Candidate ---
  @OneToOne(() => Candidate, (candidate) => candidate.user)
  candidate: Candidate;
  // ---------------------------------
  @OneToOne(() => Employer, (employer) => employer.user)
  employer: Employer;
}
