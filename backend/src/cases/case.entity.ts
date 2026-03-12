import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cases')
export class CaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId!: string | null;

  @Column({ default: 'open' })
  status!: 'open' | 'active' | 'in_review' | 'closed';

  @Column('text')
  summary!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
