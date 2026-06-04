import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { LogsServiceModule } from '@services/logs/logsService.module';

import { logsClearSchedulerProvider } from './logsClear.provider';

@Module({
  imports: [LogsServiceModule, LoggerProviderModule],
  providers: [logsClearSchedulerProvider],
})
export class LogsClearSchedulerModule {}
