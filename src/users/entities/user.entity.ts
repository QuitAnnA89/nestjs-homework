import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 12, unique: true })
  login: string;

  @Column({ unique: true, length: 30 })
  email: string;

  @Column({ select: false, name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ nullable: true, type: 'int' })
  age: number | null;

  @Column({ length: 1000, nullable: true, type: 'varchar' })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
