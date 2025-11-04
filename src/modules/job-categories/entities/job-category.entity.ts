import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';

@Entity('jobs_categories')
export class JobCategory {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  @ManyToOne(() => JobCategory, (cat) => cat.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' }) // parent_id INT REFERENCES...
  parent: JobCategory;

  @OneToMany(() => JobCategory, (cat) => cat.parent)
  children: JobCategory[];

  @Column() // name VARCHAR(255) NOT NULL
  name: string;

  @Column({ unique: true }) // slug VARCHAR(255) UNIQUE NOT NULL
  slug: string;

  @Column({ name: 'is_active', default: true }) // is_active BOOLEAN DEFAULT TRUE
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- Quan hệ ---
  @OneToMany(() => Job, (job) => job.category)
  jobs: Job[];
}