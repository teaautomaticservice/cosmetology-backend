import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { Module } from '@nestjs/common';
import { HistoryServiceModule } from '@services/history/historyService.module';

import { HistoryController } from './history.controller';

@Module({
  imports: [HistoryServiceModule, AuthorizationServiceModule, LoggerProviderModule],
  controllers: [HistoryController],
})
export class HistoryControllerModule {}
