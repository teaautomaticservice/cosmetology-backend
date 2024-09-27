import { HistoryControllerModule } from '@controllers/history/historyController.module';
import { Module } from '@nestjs/common';
import { LogsClearShedulerModule } from '@sheduler/logs/clear/logsClearSheduler.module';

import { LogsControllerModule } from './controllers/logs/logsController.module';

@Module({
  imports: [HistoryControllerModule, LogsControllerModule, LogsClearShedulerModule],
})
export class DomainModule {}
