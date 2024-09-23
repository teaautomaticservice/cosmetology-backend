import { Module } from '@nestjs/common';
import { LogsServiceModule } from '@services/logs/logsService.module';

import { LogsController } from './logs.controller';

@Module({
  imports: [LogsServiceModule],
  controllers: [LogsController],
})
export class LogsControllerModule {}
