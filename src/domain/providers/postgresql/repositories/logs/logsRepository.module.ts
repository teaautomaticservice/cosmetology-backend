import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogEntity } from './log.entity';
import { LogsDb } from './logs.db';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  providers: [LoggerProvider, LogsDb],
  exports: [LogsDb],
})
export class LogsRepositoryModule {}
