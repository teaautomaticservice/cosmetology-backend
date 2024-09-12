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
    type: 'varchar',
    nullable: true,
  })
  key: string | null;

  @Column({
    type: 'varchar',
  })
  level: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  authorizedUserId: string | null;

  @Column({
    type: 'varchar',
  })
  message: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  meta: string | null;
}
