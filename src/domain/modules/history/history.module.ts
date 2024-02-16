import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { MessageEntity } from 'src/domain/repositories/entities/message/message.entity';
import { HistoryDb } from 'src/domain/modules/history/history.db';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  providers: [HistoryService, HistoryDb],
  controllers: [HistoryController],
  exports: [HistoryDb],
})
export class HistoryModule {}
