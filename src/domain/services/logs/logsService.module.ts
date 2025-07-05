import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { LogsProviderModule } from '@domain/providers/logs/logsProvider.module';
import { Module } from '@nestjs/common';

import { LogsService } from './logs.service';

@Module({
  imports: [LogsProviderModule, LoggerProviderModule],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsServiceModule {}
