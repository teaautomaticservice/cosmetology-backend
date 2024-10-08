import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { Module } from '@nestjs/common';
import { LogsServiceModule } from '@services/logs/logsService.module';

import { LogsController } from './logs.controller';

@Module({
  imports: [LogsServiceModule, AuthorizationServiceModule],
  controllers: [LogsController],
})
export class LogsControllerModule {}
