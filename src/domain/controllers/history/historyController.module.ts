import { LoggerProvider } from '@ambientProviders/logger/logger';
import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { Module } from '@nestjs/common';
import { HistoryServiceModule } from '@services/history/historyService.module';

import { HistoryController } from './history.controller';

@Module({
  imports: [HistoryServiceModule, AuthorizationServiceModule],
  controllers: [HistoryController],
  providers: [LoggerProvider],
})
export class HistoryControllerModule {}
