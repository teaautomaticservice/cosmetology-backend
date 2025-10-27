import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';
import { HistoryServiceModule } from '@services/history/historyService.module';

import { HistoryController } from './history.controller';

@Module({
  imports: [HistoryServiceModule, AuthorizationServiceModule, LoggerProviderModule],
  controllers: [HistoryController],
})
export class HistoryControllerModule {}
