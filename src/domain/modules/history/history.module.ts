import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { MessageEntity } from 'src/domain/repositories/message/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity]),
  ],
  providers: [HistoryService],
  controllers: [HistoryController],
})
export class HistoryModule {}
