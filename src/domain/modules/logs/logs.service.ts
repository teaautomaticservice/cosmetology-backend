import { Injectable } from '@nestjs/common';

import { Pagination } from 'src/domain/repositories/types/common.types';
import { LoggerTypes } from 'src/ambient/constants/loggerTypes';
import { subtract } from 'src/ambient/utils/timestamps';

import { LogsDb } from './logs.db';
import { SpecifiedLogsClear } from './logs.types';

@Injectable()
export class LogsService {
  constructor(private readonly logRepository: LogsDb) {}

  async getLogsList(params: { pagination: Pagination }) {
    const { page, pageSize } = params.pagination;
    const [logs, count] = await this.logRepository.findAndCount(params);
    return {
      data: logs,
      meta: {
        count,
        page,
        pageSize,
      },
    };
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
