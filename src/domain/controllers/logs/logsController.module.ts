import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsServiceModule } from '@services/logs/logsService.module';

@Module({
  imports: [LogsServiceModule],
  controllers: [LogsController],
})
export class LogsControllerModule {}
