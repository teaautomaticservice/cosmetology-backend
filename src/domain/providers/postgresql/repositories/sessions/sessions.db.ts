import { DeleteResult, Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';

import { SessionEntity } from './session.entity';
import { CommonDb } from '../common/common.db';

export class SessionsDb extends CommonDb<SessionEntity> {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>
  ) {
    super(sessionsRepository);
  }

  public async deleteBySessionId(sessionId: string): Promise<DeleteResult> {
    return this.sessionsRepository.delete({ sessionId });
  }
}