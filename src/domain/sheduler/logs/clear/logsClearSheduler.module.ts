import { Module } from '@nestjs/common';
import { logsClearShedulerProvider } from './logsClear.provider';
import { LogsServiceModule } from '@services/logs/logsService.module';
import { LoggerProvider } from 'src/ambient/providers/logger/logger';

@Module({
  imports: [LogsServiceModule],
  providers: [logsClearShedulerProvider, LoggerProvider],
})
export class LogsClearShedulerModule {}
