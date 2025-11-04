import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { Employer } from '../../employers/entities/employer.entity';

@Entity('companies_categories')
export class CompanyCategory {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  @ManyToOne(() => CompanyCategory, (cat) => cat.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' }) // parent_id INT REFERENCES...
  parent: CompanyCategory;

  @OneToMany(() => CompanyCategory, (cat) => cat.parent)
  children: CompanyCategory[];

  @Column() // name VARCHAR(255) NOT NULL
  name: string;

  @Column({ unique: true }) // slug VARCHAR(255) UNIQUE NOT NULL
  slug: string;

  @Column({ type: 'text', nullable: true }) // description TEXT
  description: string;

  @Column({ name: 'is_active', default: true }) // is_active BOOLEAN DEFAULT TRUE
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;

  // --- Quan hệ (từ Bảng 6) ---
  @ManyToMany(() => Employer, (employer) => employer.industries)
  employers: Employer[];
}