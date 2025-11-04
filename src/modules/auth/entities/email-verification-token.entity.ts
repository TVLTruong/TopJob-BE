import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('increment') // id SERIAL PRIMARY KEY
  id: number;

  @ManyToOne(() => User, (user) => user.emailVerificationTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // user_id INT NOT NULL REFERENCES...
  user: User;

  @Column() // token VARCHAR(255) NOT NULL
  token: string;

  @Column({ name: 'expires_at', type: 'timestamp' }) // expires_at TIMESTAMP NOT NULL
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true }) // used_at TIMESTAMP
  usedAt: Date;

  @CreateDateColumn({ name: 'created_at' }) // created_at TIMESTAMP DEFAULT NOW()
  createdAt: Date;
}