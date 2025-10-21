import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountsDb } from './accounts.db';
import { AccountsEntity } from './accounts.entity';
import { CommonDbModule } from '../../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([AccountsEntity]), CommonDbModule],
  providers: [AccountsDb],
  exports: [AccountsDb],
})
export class AccountsRepositoryModule {}
