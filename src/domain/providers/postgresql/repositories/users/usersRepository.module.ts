import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { UsersDb } from './users.db';
import { CommonDbModule } from '../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), CommonDbModule],
  providers: [UsersDb],
  exports: [UsersDb],
})
export class UsersRepositoryModule {}