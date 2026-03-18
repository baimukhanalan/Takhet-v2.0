import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  event!: string;

  @Column({ name: 'actor_id' })
  actorId!: string;

  @Column('jsonb', { default: () => "'{}'::jsonb" })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
