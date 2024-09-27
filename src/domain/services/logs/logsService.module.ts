import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';
import { LogsRepositoryModule } from '@providers/postgresql/repositories/logs/logsRepository.module';

import { LogsService } from './logs.service';

@Module({
  imports: [LogsRepositoryModule],
  providers: [LoggerProvider, LogsService],
  exports: [LogsService],
})
export class LogsServiceModule {}
