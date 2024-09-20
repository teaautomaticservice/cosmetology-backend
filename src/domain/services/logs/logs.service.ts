import { Injectable } from '@nestjs/common';

import { Pagination } from '@providers/common/common.type';
import { LoggerTypes } from '@constants/loggerTypes';
import { LogsDb } from '@providers/postgresql/repositories/logs/logs.db';
import { SpecifiedLogsClear } from '@providers/postgresql/repositories/logs/logs.types';
import { subtract } from '@utils/timestamps';

@Injectable()
export class LogsService {
  constructor(private readonly logRepository: LogsDb) {}

  async getLogsList(params: { pagination: Pagination }) {
    return this.logRepository.findAndCount(params);
  }

  public async clearOldLogs(): Promise<{ count: number }> {
    const specified: SpecifiedLogsClear = {
      types: {
        [LoggerTypes.debug]: subtract(new Date(), 1, 'week'),
        [LoggerTypes.info]: subtract(new Date(), 2, 'month'),
        [LoggerTypes.error]: subtract(new Date(), 6, 'month'),
      },
    };

    return this.logRepository.clearLogs({
      specified,
    });
  }
}
