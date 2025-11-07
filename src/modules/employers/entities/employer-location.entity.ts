import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  // OneToMany,
  JoinColumn,
} from 'typeorm';
import { Employer } from './employer.entity';
// import { Job } from '../../jobs/entities/job.entity';

@Entity('employer_locations')
export class EmployerLocation {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  @ManyToOne(() => Employer, (emp) => emp.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employer_id' }) // employer_id INT NOT NULL REFERENCES...
  employer: Employer;

  @Column({ name: 'is_headquarters', default: false }) // is_headquarters BOOLEAN DEFAULT false
  isHeadquarters: boolean;

  @Column({ name: 'street_address', nullable: true }) // street_address VARCHAR(255)
  streetAddress: string;

  @Column({ nullable: true }) // ward VARCHAR(255)
  ward: string;

  @Column({ nullable: true }) // city VARCHAR(255)
  city: string;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- Quan hệ ---
  // @OneToMany(() => Job, (job) => job.location)
  // jobs: Job[];
}
