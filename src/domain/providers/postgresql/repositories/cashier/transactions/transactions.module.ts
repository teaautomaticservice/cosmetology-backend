import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionsDb } from './transactions.db';
import { TransactionEntity } from './transactions.entity';
import { CommonDbModule } from '../../common/commonDb.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]), CommonDbModule],
  providers: [TransactionsDb],
  exports: [TransactionsDb],
})
export class TransactionsRepositoryModule { }
