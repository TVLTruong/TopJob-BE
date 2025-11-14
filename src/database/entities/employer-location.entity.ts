// src/database/entities/employer-location.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Employer } from './employer.entity';
import { Job } from './job.entity';

/**
 * Employer Location Entity
 * Stores multiple office locations for each employer
 * Use Cases: UCEMP01-02, UCEMP03
 */
@Entity('employer_locations')
@Index(['employerId'])
@Index(['employerId', 'isHeadquarters'], { 
  unique: true, 
  where: 'is_headquarters = true' 
})
export class EmployerLocation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'employer_id' })
  employerId: string;

  @Column({ type: 'boolean', default: false, name: 'is_headquarters' })
  isHeadquarters: boolean;

  @Column({ type: 'varchar', length: 100 })
  province: string;

  @Column({ type: 'varchar', length: 100 })
  district: string;

  @Column({ type: 'text', name: 'detailed_address' })
  detailedAddress: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Employer, (employer) => employer.locations, { 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  @OneToMany(() => Job, (job) => job.location)
  jobs: Job[];

  // Virtual methods
  getFullAddress(): string {
    return `${this.detailedAddress}, ${this.district}, ${this.province}`;
  }

  getShortAddress(): string {
    return `${this.district}, ${this.province}`;
  }
}
