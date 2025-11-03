import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employer } from './employer.entity';

@Entity('employer_locations')
export class EmployerLocation {
  @PrimaryGeneratedColumn('increment') // id SERIAL
  id: number;

  // Quan hệ Nhiều-1: employer_id INT NOT NULL REFERENCES...
  @ManyToOne(() => Employer, (employer) => employer.locations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  @Column({ name: 'office_name', nullable: true })
  officeName: string;

  @Column({ name: 'is_headquarters', default: false })
  isHeadquarters: boolean;

  @Column({ name: 'street_address', nullable: true })
  streetAddress: string;

  @Column({ nullable: true })
  ward: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}