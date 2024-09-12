import { Provider } from '@nestjs/common';
import { Resources } from 'src/ambient/constants/resources';

import { ClearLogsSheduler } from './clearLogsSheduler.service';
import { LogsService } from '../logs.service';
import { Logger } from 'winston';

export const clearLogsShedulerProvider: Provider<ClearLogsSheduler> = {
  provide: Resources.ClearLogsSheduler,
  inject: [LogsService, Resources.LOGGER],
  useFactory: (logsService: LogsService, logger: Logger) =>
    new ClearLogsSheduler(logsService, logger),
};
