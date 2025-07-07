import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';

import { LogsProvider } from './logs.provider';
import { LogsRepositoryModule } from '../postgresql/repositories/logs/logsRepository.module';

@Module({
  imports: [LogsRepositoryModule, LoggerProviderModule],
  providers: [LogsProvider],
  exports: [LogsProvider],
})
export class LogsProviderModule {}