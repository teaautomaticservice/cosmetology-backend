import { AppConfigControllerModule } from '@controllers/appConfig/appConfig.module';
import { AuthorizationControllerModule } from '@controllers/authorization/authorizationController.module';
import { HistoryControllerModule } from '@controllers/history/historyController.module';
import { LogsControllerModule } from '@controllers/logs/logsController.module';
import { Module } from '@nestjs/common';
import { LogsClearShedulerModule } from '@sheduler/logs/clear/logsClearSheduler.module';

import { UsersControllerModule } from './controllers/users/usersControllerModule';
import {
  AuthorizationClearExpiredShedulerModule
} from './sheduler/authorization/clearExpired/authorizationClearExpiredSheduler.module';

@Module({
  imports: [
    HistoryControllerModule,
    LogsControllerModule,
    LogsClearShedulerModule,
    AuthorizationControllerModule,
    AppConfigControllerModule,
    AuthorizationClearExpiredShedulerModule,
    UsersControllerModule,
  ],
})
export class DomainModule {}
