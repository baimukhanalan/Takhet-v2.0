import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'case_id' })
  caseId!: string;

  @Column({ type: 'bigint' })
  amount!: number;

  @Column({ type: 'text', default: 'KZT' })
  currency!: string;

  @Column({ type: 'text', default: 'pending' })
  status!: 'pending' | 'paid' | 'failed';

  @Column({ type: 'text', default: 'kaspi' })
  provider!: string;

  @Column({ type: 'text', name: 'provider_id', nullable: true })
  providerId!: string | null;

  @Column({ type: 'text', name: 'provider_payment_id', nullable: true, unique: true })
  providerPaymentId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
