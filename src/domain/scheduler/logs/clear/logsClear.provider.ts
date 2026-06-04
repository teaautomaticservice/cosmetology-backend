import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { Provider } from '@nestjs/common';
import { LogsService } from '@services/logs/logs.service';

import { ClearLogsScheduler } from './logsClear.scheduler';

export const logsClearSchedulerProvider: Provider<ClearLogsScheduler> = {
  provide: Resources.ClearLogsScheduler,
  inject: [LogsService, Resources.LOGGER],
  useFactory: (logsService: LogsService, logger: Logger) => new ClearLogsScheduler(logsService, logger),
};
