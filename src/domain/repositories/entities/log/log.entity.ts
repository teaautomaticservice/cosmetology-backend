import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class LogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column({
    nullable: true,
  })
  key: string;

  @Column()
  level: string;

  @Column({
    nullable: true,
  })
  authorizedUserId: string;

  @Column()
  message: string;

  @Column({
    nullable: true,
  })
  meta: string;
}
