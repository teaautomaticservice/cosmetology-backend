import { UserStatus } from 'src/domain/types/users.types';
import { Column, Entity, Index } from 'typeorm';

import { CommonEntity } from '../common/common.entity';

@Entity()
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

  public static getName(entity: UserEntity): string {
    return entity.displayName || entity.email;
  }
}