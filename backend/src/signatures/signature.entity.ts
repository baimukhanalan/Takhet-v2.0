import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('signatures')
export class Signature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @Column({ name: 'signature_hash' })
  signatureHash!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
