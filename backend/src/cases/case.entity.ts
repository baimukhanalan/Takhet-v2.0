import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type CaseStatus =
  | 'created'
  | 'payment_pending'
  | 'paid'
  | 'assigned'
  | 'consultation_started'
  | 'consultation_finished'
  | 'closed';

@Entity('cases')
export class CaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId!: string | null;

  @Column({ name: 'clinic_id', nullable: true })
  clinicId!: string | null;

  @Column({ default: 'created' })
  status!: CaseStatus;

  @Column('text')
  summary!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
