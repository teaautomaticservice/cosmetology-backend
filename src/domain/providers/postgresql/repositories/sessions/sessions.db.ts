import { DeleteResult, FindOptionsWhere, Repository } from 'typeorm';

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

  public async deleteManyByWhere(where: FindOptionsWhere<SessionEntity>): Promise<DeleteResult> {
    const result = await this.sessionsRepository.delete(where);
    this.logger.info('Delete all sessions by where', {
      where,
      affected: result.affected ?? 0,
    });

    return result;
  }
}