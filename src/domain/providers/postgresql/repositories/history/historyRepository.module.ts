import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoryDb } from './history.db';
import { MessageEntity } from './message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  providers: [HistoryDb],
  exports: [HistoryDb],
})
export class HistoryRepositoryModule {}
