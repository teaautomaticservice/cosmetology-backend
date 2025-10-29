import { LessThan } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { RecordEntity } from '@providers/common/common.type';

import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { SessionEntity } from '../postgresql/repositories/sessions/session.entity';
import { SessionsDb } from '../postgresql/repositories/sessions/sessions.db';

@Injectable()
export class SessionsProvider extends CommonPostgresqlProvider<SessionEntity> {
  constructor(private readonly sessionsDb: SessionsDb) {
    super(sessionsDb);
  }

  public async findBySessionId(sessionId: string): Promise<SessionEntity | null> {
    return this.sessionsDb.findOne({ where: { sessionId } });
  }

  public async deleteBySessionId(sessionId: string): Promise<boolean> {
    const { affected } = await this.sessionsDb.deleteBySessionId(sessionId);
    return affected != null && affected > 0;
  }

  public async clearExpiredSessions(): Promise<{ count: number }> {
    const { affected } = await this.sessionsDb.deleteManyByWhere({
      expireAt: LessThan(new Date()),
    });
    return { count: affected ?? 0 };
  }

  public async create(data: RecordEntity<SessionEntity>): Promise<SessionEntity> {
    return super.create(data);
  }
}