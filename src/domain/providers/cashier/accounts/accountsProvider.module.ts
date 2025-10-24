import { Module } from '@nestjs/common';
import { AccountsRepositoryModule } from '@providers/postgresql/repositories/cashier/accounts/accounts.module';

import { AccountsProvider } from './accounts.provider';
import { MoneyStoragesProviderModule } from '../moneyStorages/moneyStorageProvider.module';

@Module({
  imports: [
    AccountsRepositoryModule,
    MoneyStoragesProviderModule,
  ],
  providers: [AccountsProvider],
  exports: [AccountsProvider],
})
export class AccountsProviderModule { }
