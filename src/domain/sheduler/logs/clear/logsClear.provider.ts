import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { Provider } from '@nestjs/common';
import { LogsService } from '@services/logs/logs.service';

import { ClearLogsSheduler } from './logsClear.sheduler';

export const logsClearShedulerProvider: Provider<ClearLogsSheduler> = {
  provide: Resources.ClearLogsSheduler,
  inject: [LogsService, Resources.LOGGER],
  useFactory: (logsService: LogsService, logger: Logger) =>
    new ClearLogsSheduler(logsService, logger),
};
