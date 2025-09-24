import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionEntity } from './session.entity';
import { SessionsDb } from './sessions.db';
import { CommonDbModule } from '../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), CommonDbModule],
  providers: [SessionsDb],
  exports: [SessionsDb],
})
export class SessionsRepositoryModule {}