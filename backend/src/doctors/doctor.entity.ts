import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true, select: false, insert: false, update: false })
  fullName?: string;

  @Column({ type: 'text', name: 'specialization' })
  specialization!: string;

  @Column({ type: 'text', name: 'license_number', nullable: true })
  licenseNumber!: string | null;

  @Column({ type: 'integer', name: 'experience_years', nullable: true })
  experienceYears!: number | null;

  @Column({ type: 'boolean', name: 'verified', default: false })
  verified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
