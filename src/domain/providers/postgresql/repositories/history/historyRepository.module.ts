import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoryDb } from './history.db';
import { MessageEntity } from './message.entity';
import { CommonDbModule } from '../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), CommonDbModule],
  providers: [HistoryDb],
  exports: [HistoryDb],
})
export class HistoryRepositoryModule {}
