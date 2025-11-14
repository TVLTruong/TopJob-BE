// src/database/entities/employer-pending-edit.entity.ts

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

/**
 * Employer Pending Edit Entity
 * Stores sensitive field changes that require admin approval
 * Use Cases: UCEMP02, UCADM01
 */
@Entity('employer_pending_edits')
@Index(['employerId'])
@Index(['fieldName'])
export class EmployerPendingEdit {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'employer_id' })
  employerId: string;

  @Column({ type: 'varchar', length: 100, name: 'field_name' })
  fieldName: string;

  @Column({ type: 'text', nullable: true, name: 'old_value' })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true, name: 'new_value' })
  newValue: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Employer, (employer) => employer.pendingEdits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  // Virtual methods
  getFieldLabel(): string {
    const labels: Record<string, string> = {
      companyName: 'Tên công ty',
      logoUrl: 'Logo',
      website: 'Website',
    };
    return labels[this.fieldName] || this.fieldName;
  }

  isSensitiveField(): boolean {
    const sensitiveFields = ['companyName', 'logoUrl'];
    return sensitiveFields.includes(this.fieldName);
  }
}
