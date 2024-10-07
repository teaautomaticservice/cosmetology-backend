import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionEntity } from './session.entity';
import { SessionsDb } from './sessions.db';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity])],
  providers: [LoggerProvider, SessionsDb],
  exports: [SessionsDb],
})
export class SessionsRepositoryModule {}