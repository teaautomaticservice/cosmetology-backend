import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionEntity } from './session.entity';
import { SessionsDb } from './sessions.db';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), LoggerProviderModule],
  providers: [SessionsDb],
  exports: [SessionsDb],
})
export class SessionsRepositoryModule {}