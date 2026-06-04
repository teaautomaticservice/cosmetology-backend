import { AppConfigControllerModule } from '@controllers/appConfig/appConfig.module';
import { AuthorizationControllerModule } from '@controllers/authorization/authorizationController.module';
import { HistoryControllerModule } from '@controllers/history/historyController.module';
import { LogsControllerModule } from '@controllers/logs/logsController.module';
import { Module } from '@nestjs/common';
import { LogsClearSchedulerModule } from '@scheduler/logs/clear/logsClearScheduler.module';

import { CashierControllerModule } from './controllers/cashier/cashierController.module';
import { UsersControllerModule } from './controllers/users/usersControllerModule';
import {
  AuthorizationClearExpiredSchedulerModule
} from './scheduler/authorization/clearExpired/authorizationClearExpiredScheduler.module';

@Module({
  imports: [
    HistoryControllerModule,
    LogsControllerModule,
    LogsClearSchedulerModule,
    AuthorizationControllerModule,
    AppConfigControllerModule,
    AuthorizationClearExpiredSchedulerModule,
    UsersControllerModule,
    CashierControllerModule,
  ],
})
export class DomainModule {}
