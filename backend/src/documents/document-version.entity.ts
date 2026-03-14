import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('document_versions')
export class DocumentVersionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'document_id' })
  documentId!: string;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber!: number;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson!: Record<string, any>;

  @Column({ name: 'pdf_path', nullable: true })
  pdfPath!: string | null;

  @Column({ name: 'created_by' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
