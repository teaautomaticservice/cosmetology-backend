import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsRepositoryModule } from '@providers/postgresql/repositories/logs/logsRepository.module';
import { LoggerProvider } from 'src/ambient/providers/logger/logger';

@Module({
  imports: [LogsRepositoryModule],
  providers: [LoggerProvider, LogsService],
  exports: [LogsService],
})
export class LogsServiceModule {}
