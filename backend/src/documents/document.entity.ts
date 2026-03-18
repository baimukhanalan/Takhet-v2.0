import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type DocumentType = 'report' | 'prescription' | 'certificate';
export type DocumentStatus = 'draft' | 'ready_for_sign' | 'signed' | 'archived' | 'cancelled' | 'replaced';

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'case_id' })
  caseId!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @Column({ type: 'varchar' })
  type!: DocumentType;

  @Column({ type: 'varchar', default: 'draft' })
  status!: DocumentStatus;

  @Column({ type: 'varchar' })
  title!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
