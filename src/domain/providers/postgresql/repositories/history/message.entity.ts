import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { MESSAGES_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';

@Entity(MESSAGES_ENTITY)
export class MessageEntity extends CommonEntity {
  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column()
  @Index('messageCreatedByUserId_1')
  public createdByUserId: number;

  @Column()
  @Index('messageUpdatedByUserId_1')
  public updatedByUserId: number;
}
