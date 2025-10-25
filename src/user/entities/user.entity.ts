import {
  Entity,
  PrimaryGeneratedColumn, // <-- THAY ĐỔI: Không dùng PrimaryColumn
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users') // Tên bảng trong database
export class User {
  @PrimaryGeneratedColumn('uuid') // <-- THAY ĐỔI: Dùng UUID làm khóa chính tự tạo
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['CANDIDATE', 'RECRUITER', 'ADMIN'],
    default: 'CANDIDATE',
  })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
