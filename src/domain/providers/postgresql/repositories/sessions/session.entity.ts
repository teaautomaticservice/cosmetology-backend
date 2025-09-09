import {
  Column,
  Entity,
  Index,
} from 'typeorm';

import { SESSIONS_ENTITY } from '../../constants/entities';
import { CommonEntity } from '../common/common.entity';

@Entity(SESSIONS_ENTITY)
export class SessionEntity extends CommonEntity {
    @Column()
    @Index('sessionId_1')
  public sessionId: string;

    @Column()
    @Index('expireAt_1', { expireAfterSeconds: 0 })
    public expireAt: Date;

    @Column()
    @Index('userId_1')
    public userId: number;
}
