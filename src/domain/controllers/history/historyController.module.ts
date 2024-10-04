import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';
import { HistoryServiceModule } from '@services/history/historyService.module';

import { HistoryController } from './history.controller';

@Module({
  imports: [HistoryServiceModule],
  controllers: [HistoryController],
  providers: [LoggerProvider],
})
export class HistoryControllerModule {}
