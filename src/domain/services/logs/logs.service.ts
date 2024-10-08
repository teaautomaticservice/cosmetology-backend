import { LoggerTypes } from '@constants/loggerTypes';
import { LogsProvider } from '@domain/providers/logs/logs.provider';
import { Injectable } from '@nestjs/common';
import { Pagination } from '@providers/common/common.type';
import { LogEntity } from '@providers/postgresql/repositories/logs/log.entity';
import { SpecifiedLogsClear } from '@providers/postgresql/repositories/logs/logs.types';
import { dateUtils } from '@utils/dateUtils';

@Injectable()
export class LogsService {
  constructor(private readonly logsProvider: LogsProvider) {}

  public async getLogsList(params: { pagination: Pagination }): Promise<[LogEntity[], number]> {
    return this.logsProvider.findAndCount(params);
  }

  public async clearOldLogs(): Promise<{ count: number }> {
    const specified: SpecifiedLogsClear = {
      types: {
        [LoggerTypes.debug]: dateUtils.subtract(new Date(), 1, 'week'),
        [LoggerTypes.info]: dateUtils.subtract(new Date(), 2, 'month'),
        [LoggerTypes.error]: dateUtils.subtract(new Date(), 6, 'month'),
      },
    };

    return this.logsProvider.clearLogs({
      specified,
    });
  }
}
