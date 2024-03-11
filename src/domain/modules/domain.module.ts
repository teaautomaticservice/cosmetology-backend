import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoryController } from './history/history.controller';
import { HistoryService } from './history/history.service';
import { MessageEntity } from 'src/domain/repositories/entities/message/message.entity';
import { HistoryDb } from 'src/domain/modules/history/history.db';
import { LoggerProvider } from 'src/ambient/logger/logger';
import { LogsController } from './logs/logs.controller';
import { LogsService } from './logs/logs.service';
import { LogEntity } from '../repositories/entities/log/log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessageEntity,
      LogEntity,
    ]),
  ],
  providers: [
    LoggerProvider,
    HistoryService,
    HistoryDb,
    LogsService,
  ],
  controllers: [
    HistoryController,
    LogsController,
  ],
  exports: [
    HistoryDb,
  ],
})
export class DomainModule {}
