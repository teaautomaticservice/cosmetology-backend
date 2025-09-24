import { Column, CreateDateColumn, Entity, Index } from 'typeorm';

import { MESSAGES_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';

@Entity(MESSAGES_ENTITY)
export class MessageEntity extends CommonEntity {
  @CreateDateColumn()
  public date: Date;

  @Column()
  public message: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  @Index('messageCreatedByUserId_1')
  public createdBy: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  @Index('messageUpdatedByUserId_1')
  public updatedBy: number | null;
}
