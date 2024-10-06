import { Column, CreateDateColumn, Entity } from 'typeorm';

import { MESSAGES_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';

@Entity(MESSAGES_ENTITY)
export class MessageEntity extends CommonEntity {
  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  public owner: string;
}
