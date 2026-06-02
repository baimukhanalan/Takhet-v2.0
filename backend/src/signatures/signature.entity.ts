import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'document_id' })
  documentId!: string;

  @Column({ type: 'text', name: 'signature_hash' })
  signatureHash!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
