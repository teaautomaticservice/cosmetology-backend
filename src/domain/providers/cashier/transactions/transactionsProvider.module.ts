import { Module } from '@nestjs/common';
import { TransactionsRepositoryModule } from '@postgresql/repositories/cashier/transactions/transactions.module';

import { TransactionsProvider } from './transactions.provider';

@Module({
  imports: [
    TransactionsRepositoryModule,
  ],
  providers: [TransactionsProvider],
  exports: [TransactionsProvider],
})
export class TransactionsProviderModule { }
