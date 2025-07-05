import {  } from '@ambientProviders/logger/logger.provider';
import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HistoryDb } from './history.db';
import { MessageEntity } from './message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), LoggerProviderModule],
  providers: [HistoryDb],
  exports: [HistoryDb],
})
export class HistoryRepositoryModule {}
