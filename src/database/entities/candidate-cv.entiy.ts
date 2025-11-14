// src/database/entities/candidate-cv.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Candidate } from './candidate.entity';

/**
 * Candidate CV Entity
 * Stores multiple CV files for each candidate
 * Use Cases: UCCAN02
 */
@Entity('candidate_cvs')
@Index(['candidateId'])
@Index(['candidateId', 'isDefault'], { 
  unique: true, 
  where: 'is_default = true' 
})
export class CandidateCv {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'candidate_id' })
  candidateId: string;

  @Column({ type: 'varchar', length: 255, name: 'file_name' })
  fileName: string;

  @Column({ type: 'text', name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'int', nullable: true, name: 'file_size' })
  fileSize: number | null; // in bytes

  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP', 
    name: 'uploaded_at' 
  })
  uploadedAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Candidate, (candidate) => candidate.cvs, { 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateDefault() {
    // Ensure only one default CV per candidate
    // This is also enforced at database level with unique partial index
  }

  // Virtual methods
  getFileSizeInMB(): number {
    if (!this.fileSize) return 0;
    return Number((this.fileSize / (1024 * 1024)).toFixed(2));
  }

  getFileExtension(): string {
    return this.fileName.split('.').pop()?.toLowerCase() || '';
  }

  isPDF(): boolean {
    return this.getFileExtension() === 'pdf';
  }
}
