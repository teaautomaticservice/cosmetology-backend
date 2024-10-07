import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { SESSIONS_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';
import { UserEntity } from '../users/user.entity';

@Entity(SESSIONS_ENTITY)
export class SessionEntity extends CommonEntity {
    @Column()
    @Index('sessionId_1')
  public sessionId: string;

    @Column()
    @Index('expireAt_1', { expireAfterSeconds: 0 })
    public expireAt: Date;

    @ManyToOne(() => UserEntity, (user) => user.id)
    @Index('userId_1')
    public userId: number;
}
