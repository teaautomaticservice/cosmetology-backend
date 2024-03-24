import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { LogsService } from '../logs.service';
import { Resources } from 'src/ambient/constants/resources';
import { Logger } from 'winston';

const DAEMON_NAME = 'daemonClearLogs';

@Injectable()
export class ClearLogsSheduler {
  constructor(
    private readonly logsService: LogsService,
    @Inject(Resources.LOGGER) private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: DAEMON_NAME
  })
  async clearLogs() {
    const { count } = await this.logsService.clearOldLogs();
    this.logger.info('Scheduled log cleanup', {
      daemonName: DAEMON_NAME,
      countEntities: count,
    })
  }
}