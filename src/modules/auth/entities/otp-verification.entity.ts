import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('otp_verifications')
@Index(['email']) // Tăng tốc tìm kiếm
@Index(['createdAt'])
export class OtpVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 6 })
  otp: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  usedAt: Date;

  // Optional: liên kết với User nếu cần audit
  @ManyToOne(() => User, { nullable: true })
  user?: User;
}
