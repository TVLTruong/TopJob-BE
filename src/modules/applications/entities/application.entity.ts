import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
// import { Candidate } from '../../candidates/entities/candidate.entity';
import { Job } from '../../jobs/entities/job.entity';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  // @ManyToOne(() => Candidate, (can) => can.applications, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'candidate_id' }) // candidate_id INT NOT NULL REFERENCES...
  // candidate: Candidate;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' }) // job_id INT NOT NULL REFERENCES...
  job: Job;

  @Column({ name: 'cv_url', type: 'text', nullable: true }) // cv_url TEXT
  cvUrl: string;

  @Column({ name: 'cover_letter', type: 'text', nullable: true }) // cover_letter TEXT
  coverLetter: string;

  @Column({ default: 'applied' }) // status VARCHAR(50) DEFAULT 'applied'
  status: string;

  @Column({ name: 'status_updated_at', type: 'timestamp', nullable: true })
  statusUpdatedAt: Date;

  @Column({ name: 'employer_note', type: 'text', nullable: true }) // employer_note TEXT
  employerNote: string;

  @Column({ type: 'int', nullable: true }) // rating INT
  rating: number;

  @Column({
    name: 'applied_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  appliedAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'interview_scheduled_at', type: 'timestamp', nullable: true })
  interviewScheduledAt: Date;

  @Column({ name: 'interview_notes', type: 'text', nullable: true }) // interview_notes TEXT
  interviewNotes: string;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // updated_at TIMESTAMP DEFAULT NOW()
  updatedAt: Date;
}
