import {
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @Index()
  @UpdateDateColumn({ type: 'timestamptz' })
  public updatedAt: Date;
}
