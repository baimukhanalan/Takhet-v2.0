import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'case_id' })
  caseId!: string;

  @Column({ name: 'clinic_id', nullable: true })
  clinicId!: string | null;

  @Column('bigint')
  amount!: number;

  @Column({ default: 'pending' })
  status!: 'pending' | 'paid' | 'failed';

  @Column({ name: 'provider_id', nullable: true })
  providerId!: string | null;

  @Column({ name: 'provider_payment_id', nullable: true, unique: true })
  providerPaymentId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
