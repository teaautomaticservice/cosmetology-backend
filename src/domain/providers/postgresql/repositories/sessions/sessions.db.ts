import { InjectRepository } from '@nestjs/typeorm';
import { CommonDb } from '../common/common.db';
import { SessionEntity } from './session.entity';
import { Repository } from 'typeorm';

export class SessionsDb extends CommonDb<SessionEntity> {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionsRepository: Repository<SessionEntity>
  ) {
    super(sessionsRepository);
  }
}