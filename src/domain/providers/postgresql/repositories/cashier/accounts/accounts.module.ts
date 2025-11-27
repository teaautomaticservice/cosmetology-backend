import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountsDb } from './accounts.db';
import { AccountEntity } from './accounts.entity';
import { CommonDbModule } from '../../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), CommonDbModule],
  providers: [AccountsDb],
  exports: [AccountsDb],
})
export class AccountsRepositoryModule {}
