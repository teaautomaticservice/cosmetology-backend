import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MoneyStoragesDb } from './moneyStorages.db';
import { MoneyStoragesEntity } from './moneyStorages.entity';
import { CommonDbModule } from '../../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([MoneyStoragesEntity]), CommonDbModule],
  providers: [MoneyStoragesDb],
  exports: [MoneyStoragesDb],
})
export class MoneyStoragesRepositoryModule {}
