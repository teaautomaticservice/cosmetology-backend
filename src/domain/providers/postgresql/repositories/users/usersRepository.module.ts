import {  } from '@ambientProviders/logger/logger.provider';
import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { UsersDb } from './users.db';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), LoggerProviderModule],
  providers: [UsersDb],
  exports: [UsersDb],
})
export class UsersRepositoryModule {}