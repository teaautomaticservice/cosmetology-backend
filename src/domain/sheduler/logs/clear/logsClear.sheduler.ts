import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogsService } from '@services/logs/logs.service';

const DAEMON_NAME = 'daemonClearLogs';

@Injectable()
export class ClearLogsSheduler {
  constructor(private readonly logsService: LogsService, @Inject(Resources.LOGGER) private readonly logger: Logger) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: DAEMON_NAME,
  })
  public async clearLogs(): Promise<void> {
    const { count } = await this.logsService.clearOldLogs();
    this.logger.info('Scheduled log cleanup', {
      daemonName: DAEMON_NAME,
      countEntities: count,
    });
  }
}
