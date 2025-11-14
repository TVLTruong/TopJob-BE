// src/database/entities/approval-log.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApprovalAction, ApprovalTargetType } from '../../common/enums';
import { User } from './user.entity';

@Entity('approval_logs')
@Index(['targetType', 'targetId'])
export class ApprovalLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', name: 'admin_id' })
  adminId: string;

  @Column({ type: 'enum', enum: ApprovalTargetType, name: 'target_type' })
  targetType: ApprovalTargetType;

  @Column({ type: 'bigint', name: 'target_id' })
  targetId: string;

  @Column({ type: 'enum', enum: ApprovalAction })
  action: ApprovalAction;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'admin_id' })
  admin: User;
}
