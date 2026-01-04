// src/database/entities/company-category.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EmployerEmployerCategory } from './employer-employer-category.entity';

/**
 * Company Category Entity
 * Industry/sector categories for companies
 * Use Cases: UCADM06, UCGUEST04
 */
@Entity('employer_categories')
@Index(['slug'])
export class EmployerCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  // @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => EmployerEmployerCategory, (ec) => ec.category)
  employerEmployerCategories: EmployerEmployerCategory[];

  // Virtual methods
  getIsActive(): boolean {
    return this.isActive;
  }
}
