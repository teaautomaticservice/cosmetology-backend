import { Column, CreateDateColumn, Entity } from 'typeorm';

import { CommonEntity } from '../common/common.entity';

@Entity()
export class MessageEntity extends CommonEntity {
  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  public owner: string;
}
