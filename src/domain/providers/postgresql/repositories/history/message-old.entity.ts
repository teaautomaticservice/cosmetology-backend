import { Column, CreateDateColumn, Entity } from 'typeorm';

import { CommonEntity } from '../common/common.entity';

@Entity('message_entity')
export class MessageEntityOld {
  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  public owner: string;
}
