import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';
import { LogsServiceModule } from '@services/logs/logsService.module';

import { logsClearShedulerProvider } from './logsClear.provider';

@Module({
  imports: [LogsServiceModule],
  providers: [logsClearShedulerProvider, LoggerProvider],
})
export class LogsClearShedulerModule {}
