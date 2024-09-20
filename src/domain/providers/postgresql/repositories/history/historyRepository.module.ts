import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './message.entity';
import { HistoryDb } from './history.db';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  providers: [HistoryDb],
  exports: [HistoryDb],
})
export class HistoryRepositoryModule {}
