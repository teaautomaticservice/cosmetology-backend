import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  key: string;

  @Column()
  level: string;

  @Column()
  authorizedUserId: string;

  @Column()
  message: string;

  @Column()
  meta: string;
}