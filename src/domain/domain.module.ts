import { AuthorizationControllerModule } from '@controllers/authorization/authorizationController.module';
import { HistoryControllerModule } from '@controllers/history/historyController.module';
import { LogsControllerModule } from '@controllers/logs/logsController.module';
import { Module } from '@nestjs/common';
import { LogsClearShedulerModule } from '@sheduler/logs/clear/logsClearSheduler.module';

@Module({
  imports: [HistoryControllerModule, LogsControllerModule, LogsClearShedulerModule, AuthorizationControllerModule],
})
export class DomainModule {}
