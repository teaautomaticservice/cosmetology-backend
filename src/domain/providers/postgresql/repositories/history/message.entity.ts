import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { CommonEntity } from '../common/common.entity';

@Entity()
export class MessageEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  public owner: string;
}
