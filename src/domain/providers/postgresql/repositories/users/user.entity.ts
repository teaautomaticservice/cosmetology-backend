import { Column, Entity, Index } from 'typeorm';

import { UserStatus, UserType } from '@domain/types/users.types';

import { USERS_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';

@Entity(USERS_ENTITY)
export class UserEntity extends CommonEntity {
  @Column()
  @Index('email_1', { unique: true, sparse: true })
  public email: string;

  @Column()
  @Index('password_1')
  public password: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @Index('displayName_1')
  public displayName?: string | null;

  @Column('enum', { enum: UserStatus })
  public status: UserStatus;

  @Column('enum', { enum: UserType })
  public type: UserType;

  public static getName(entity: UserEntity): string {
    return entity.displayName || entity.email;
  }
}