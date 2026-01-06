import { Module } from '@nestjs/common';
import { AccountsRepositoryModule } from '@providers/postgresql/repositories/cashier/accounts/accounts.module';

import { AccountsProvider } from './accounts.provider';
import { CurrenciesProviderModule } from '../currencies/currenciesProvider.module';
import { MoneyStoragesProviderModule } from '../moneyStorages/moneyStorageProvider.module';
import { TransactionsProviderModule } from '../transactions/transactionsProvider.module';

@Module({
  imports: [
    AccountsRepositoryModule,
    MoneyStoragesProviderModule,
    CurrenciesProviderModule,
    TransactionsProviderModule,
  ],
  providers: [AccountsProvider],
  exports: [AccountsProvider],
})
export class AccountsProviderModule { }
