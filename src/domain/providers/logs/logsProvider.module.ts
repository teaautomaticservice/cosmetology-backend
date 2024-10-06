import { Module } from '@nestjs/common';

import { LogsProvider } from './logs.provider';
import { LogsRepositoryModule } from '../postgresql/repositories/logs/logsRepository.module';

@Module({
  imports: [LogsRepositoryModule],
  providers: [LogsProvider],
  exports: [LogsProvider],
})
export class LogsProviderModule {}