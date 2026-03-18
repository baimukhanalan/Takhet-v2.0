import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('triage_sessions')
export class TriageSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column('text')
  symptoms!: string;

  @Column('jsonb', { default: () => "'{}'::jsonb" })
  aiResult!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
