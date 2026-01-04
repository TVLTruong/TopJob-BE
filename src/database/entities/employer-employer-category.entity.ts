// src/database/entities/employer-employer-category.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employer } from './employer.entity';
import { EmployerCategory } from './employer-category.entity';

/**
 * Employer-EmployerCategory Entity
 * Junction table for many-to-many relationship between employers and employer categories
 * Allows an employer to belong to multiple industry/sector categories
 */
@Entity('employer_employer_categories')
@Index(['employerId', 'categoryId'], { unique: true })
export class EmployerEmployerCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'employer_id' })
  @Index()
  employerId: string;

  @Column({ type: 'bigint', name: 'category_id' })
  @Index()
  categoryId: string;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary: boolean; // true for the main category of the employer

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne('Employer', 'employerCategories', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  @ManyToOne('EmployerCategory', 'employerEmployerCategories', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: EmployerCategory;
}
