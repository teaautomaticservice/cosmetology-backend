import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';
import { LogsServiceModule } from '@services/logs/logsService.module';

import { LogsController } from './logs.controller';

@Module({
  imports: [LogsServiceModule, AuthorizationServiceModule],
  controllers: [LogsController],
})
export class LogsControllerModule {}
