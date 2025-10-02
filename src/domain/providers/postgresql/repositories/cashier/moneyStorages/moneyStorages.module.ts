import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { moneyStoragesDb } from './moneyStorages.db';
import { MoneyStoragesEntity } from './moneyStorages.entity';
import { CommonDbModule } from '../../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([MoneyStoragesEntity]), CommonDbModule],
  providers: [moneyStoragesDb],
  exports: [moneyStoragesDb],
})
export class MoneyStoragesModule {}
