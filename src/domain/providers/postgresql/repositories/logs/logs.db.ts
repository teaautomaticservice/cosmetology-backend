import { DeleteResult, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LogEntity } from './log.entity';
import { CommonDb } from '../common/common.db';

@Injectable()
export class LogsDb extends CommonDb<LogEntity> {
  constructor(
    @InjectRepository(LogEntity) private readonly logsRepository: Repository<LogEntity>,
  ) {
    super(logsRepository);
  }

  public deleteManyByIds(ids: LogEntity['id'][]): Promise<DeleteResult> {
    this.logger.info('Delete many logs by ids', {
      ids,
    });
    return this.dbRepository.delete(ids);
  }
}
