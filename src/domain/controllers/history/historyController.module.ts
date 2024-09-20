import { Module } from '@nestjs/common';
import { HistoryController } from '@controllers/history/history.controller';
import { HistoryServiceModule } from '@services/history/historyService.module';
import { LoggerProvider } from 'src/ambient/providers/logger/logger';

@Module({
  imports: [HistoryServiceModule],
  controllers: [HistoryController],
  providers: [LoggerProvider],
})
export class HistoryControllerModule {}
