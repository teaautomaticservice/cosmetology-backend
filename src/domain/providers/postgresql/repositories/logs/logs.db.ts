import { LessThan, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { LogEntity } from './log.entity';
import { SpecifiedLogsClear } from './logs.types';
import { CommonRepository } from '../common/common.db';
import { Where } from '../common/common.types';

@Injectable()
export class LogsDb extends CommonRepository<LogEntity> {
  constructor(
    @InjectRepository(LogEntity)
    private readonly logsRepository: Repository<LogEntity>
  ) {
    super(logsRepository);
  }

  public async clearLogs({ specified }: { specified?: SpecifiedLogsClear }): Promise<{ count: number }> {
    const where: Where<LogEntity> = [];

    if (specified) {
      Object.entries(specified.types ?? {}).map(([key, val]) => {
        where.push({
          level: key,
          timestamp: LessThan(val),
        });
      });
    }

    const [entities] = await this.findAllSpecified({
      where,
    });

    if (entities.length) {
      await this.deleteManyByIds(entities.map(({ id }) => id));
    }

    return { count: entities.length };
  }
}
