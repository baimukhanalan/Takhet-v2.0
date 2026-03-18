import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type RtcSessionStatus = 'waiting' | 'active' | 'ended' | 'failed';

@Entity('rtc_sessions')
export class RtcSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'case_id' })
  caseId!: string;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @Column({ type: 'varchar', default: 'waiting' })
  status!: RtcSessionStatus;

  @Column({ name: 'offer_sdp', type: 'text', nullable: true })
  offerSdp!: string | null;

  @Column({ name: 'answer_sdp', type: 'text', nullable: true })
  answerSdp!: string | null;

  @Column({ name: 'ice_candidates', type: 'jsonb', default: () => "'[]'::jsonb" })
  iceCandidates!: Array<{ role: 'doctor' | 'patient'; candidate: any }>;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'int', nullable: true })
  duration!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
