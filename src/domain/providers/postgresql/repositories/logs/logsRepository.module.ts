import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogEntity } from './log.entity';
import { LogsDb } from './logs.db';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity]), LoggerProviderModule],
  providers: [LogsDb],
  exports: [LogsDb],
})
export class LogsRepositoryModule {}
