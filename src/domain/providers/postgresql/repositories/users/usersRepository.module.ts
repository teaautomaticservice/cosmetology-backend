import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { UsersDb } from './users.db';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [LoggerProvider, UsersDb],
  exports: [UsersDb],
})
export class UsersRepositoryModule {}