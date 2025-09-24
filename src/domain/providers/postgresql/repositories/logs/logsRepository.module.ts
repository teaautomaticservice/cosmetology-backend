import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LogEntity } from './log.entity';
import { LogsDb } from './logs.db';
import { CommonDbModule } from '../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity]), CommonDbModule],
  providers: [LogsDb],
  exports: [LogsDb],
})
export class LogsRepositoryModule {}
