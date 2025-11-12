import { Module } from '@nestjs/common';
import { AccountsRepositoryModule } from '@providers/postgresql/repositories/cashier/accounts/accounts.module';

import { AccountsProvider } from './accounts.provider';
import { CurrenciesProviderModule } from '../currencies/currenciesProvider.module';
import { MoneyStoragesProviderModule } from '../moneyStorages/moneyStorageProvider.module';

@Module({
  imports: [
    AccountsRepositoryModule,
    MoneyStoragesProviderModule,
    CurrenciesProviderModule,
  ],
  providers: [AccountsProvider],
  exports: [AccountsProvider],
})
export class AccountsProviderModule { }
