import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { LogsProviderModule } from '@providers/logs/logsProvider.module';

import { LogsService } from './logs.service';

@Module({
  imports: [LogsProviderModule, LoggerProviderModule],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsServiceModule {}
