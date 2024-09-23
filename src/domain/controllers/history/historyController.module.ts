import { LoggerProvider } from '@ambientProviders/logger/logger';
import { HistoryController } from '@controllers/history/history.controller';
import { Module } from '@nestjs/common';
import { HistoryServiceModule } from '@services/history/historyService.module';

@Module({
  imports: [HistoryServiceModule],
  controllers: [HistoryController],
  providers: [LoggerProvider],
})
export class HistoryControllerModule {}
