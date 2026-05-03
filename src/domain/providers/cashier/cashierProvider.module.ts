import { AsyncContextProviderModule } from '@ambientProviders/asyncContext/asyncContextProvider.module';
import { Module } from '@nestjs/common';

import { AccountsProviderModule } from './accounts/accountsProvider.module';
import { CurrenciesProviderModule } from './currencies/currenciesProvider.module';
import { MoneyStoragesProviderModule } from './moneyStorages/moneyStorageProvider.module';
import { TransactionsProviderModule } from './transactions/transactionsProvider.module';
import { CashierTxRunner } from './cashier.txRunner';

@Module({
  imports: [
    AccountsProviderModule,
    CurrenciesProviderModule,
    MoneyStoragesProviderModule,
    TransactionsProviderModule,
    AsyncContextProviderModule,
  ],
  providers: [CashierTxRunner],
  exports: [CashierTxRunner],
})
export class CashierProviderModule { }
