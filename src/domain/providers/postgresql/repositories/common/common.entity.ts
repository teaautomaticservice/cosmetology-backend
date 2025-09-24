import {
  Column,
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

  @Column({
    type: 'int',
    nullable: true,

  })
  @Index()
  public createdBy?: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  @Index()
  public updatedBy?: number | null;
}
