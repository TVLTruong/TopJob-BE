// src/database/entities/job-category.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Tree,
  TreeParent,
  TreeChildren,
  Index,
} from 'typeorm';
import { Job } from './job.entity';

/**
 * Job Category Entity
 * Hierarchical category structure for job posts
 * Use Cases: UCADM06, UCGUEST01, UCEMP03
 */
@Entity('jobs_categories')
@Tree('closure-table')
@Index(['slug'])
export class JobCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', nullable: true, name: 'parent_id' })
  parentId: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  // @Index()
  slug: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Tree Relations
  @TreeParent()
  parent: JobCategory | null;

  @TreeChildren()
  children: JobCategory[];

  // Regular Relations
  @OneToMany(() => Job, (job) => job.category)
  jobs: Job[];

  // Virtual methods
  isParentCategory(): boolean {
    return this.children && this.children.length > 0;
  }

  hasParent(): boolean {
    return !!this.parentId;
  }

  getFullPath(): string {
    // Will be populated when using tree repository
    // Example: "IT > Software Development"
    return this.name;
  }
}
