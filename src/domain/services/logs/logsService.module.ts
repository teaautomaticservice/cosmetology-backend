import { LoggerProvider } from '@ambientProviders/logger/logger';
import { LogsProviderModule } from '@domain/providers/logs/logsProvider.module';
import { Module } from '@nestjs/common';

import { LogsService } from './logs.service';

@Module({
  imports: [LogsProviderModule],
  providers: [LoggerProvider, LogsService],
  exports: [LogsService],
})
export class LogsServiceModule {}
