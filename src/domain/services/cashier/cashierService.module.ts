import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { AccountsProviderModule } from '@domain/providers/cashier/accounts/accountsProvider.module';
import { CurrenciesProviderModule } from '@domain/providers/cashier/currencies/currenciesProvider.module';
import { Module } from '@nestjs/common';
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
