import { Injectable } from '@nestjs/common';
import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { SessionEntity } from '../postgresql/repositories/sessions/session.entity';
import { SessionsDb } from '../postgresql/repositories/sessions/sessions.db';

@Injectable()
export class SessionsProvider extends CommonPostgresqlProvider<SessionEntity> {
  constructor(private readonly sessionsDb: SessionsDb) {
    super(sessionsDb);
  }
}