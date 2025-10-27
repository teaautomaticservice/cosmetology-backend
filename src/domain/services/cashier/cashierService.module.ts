import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { AccountsProviderModule } from '@providers/cashier/accounts/accountsProvider.module';
import { CurrenciesProviderModule } from '@providers/cashier/currencies/currenciesProvider.module';
import { MoneyStoragesProviderModule } from '@providers/cashier/moneyStorages/moneyStorageProvider.module';

import { CashierService } from './cashier.service';

@Module({
  imports: [
    LoggerProviderModule,
    CurrenciesProviderModule,
    MoneyStoragesProviderModule,
    AccountsProviderModule,
  ],
  providers: [CashierService],
  exports: [CashierService],
})
export class CashierServiceModule { }
