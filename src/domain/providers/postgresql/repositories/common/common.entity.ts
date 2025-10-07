import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  public createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public updatedAt: Date;

  @Column({
    type: 'int',
    nullable: true,

  })
  public createdBy?: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  public updatedBy?: number | null;
}
