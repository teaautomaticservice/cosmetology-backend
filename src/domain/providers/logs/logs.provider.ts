import { LessThan } from 'typeorm';

import { Injectable } from '@nestjs/common';

import { CommonPostgresqlProvider } from '../common/commonPostgresql.provider';
import { Where } from '../postgresql/repositories/common/common.types';
import { LogEntity } from '../postgresql/repositories/logs/log.entity';
import { LogsDb } from '../postgresql/repositories/logs/logs.db';
import { SpecifiedLogsClear } from '../postgresql/repositories/logs/logs.types';

@Injectable()
export class LogsProvider extends CommonPostgresqlProvider<LogEntity> {
  constructor(private readonly logsDb: LogsDb) {
    super(logsDb);
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

    const entities = await this.logsDb.find({
      where,
    });

    if (entities.length) {
      await this.logsDb.deleteManyByIds(entities.map(({ id }) => id));
    }

    return { count: entities.length };
  }
}