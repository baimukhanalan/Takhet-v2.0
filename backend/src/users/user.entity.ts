import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  role!: string;

  @Column({ default: false })
  disabled!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
