import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  // ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';
// import { Job } from '../../jobs/entities/job.entity';

@Entity('saved_jobs')
@Unique(['candidate', 'job']) // UNIQUE(candidate_id, job_id)
export class SavedJob {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  // @ManyToOne(() => Candidate, (can) => can.savedJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' }) // candidate_id INT NOT NULL REFERENCES...
  candidate: Candidate;

  // @ManyToOne(() => Job, (job) => job.savedJobs, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'job_id' }) // job_id INT NOT NULL REFERENCES...
  // job: Job;

  @CreateDateColumn({ name: 'saved_at' }) // saved_at TIMESTAMP DEFAULT NOW()
  savedAt: Date;
}
