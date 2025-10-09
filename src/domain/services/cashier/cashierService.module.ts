import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { CurrenciesProviderModule } from '@domain/providers/cashier/currencies/currenciesProvider.module';
import { Module } from '@nestjs/common';
import { MoneyStoragesProviderModule } from '@providers/cashier/moneyStorages/moneyStorageProvider.module';

import { CashierService } from './cashier.service';

@Module({
  imports: [
    CurrenciesProviderModule,
    MoneyStoragesProviderModule,
    LoggerProviderModule,
  ],
  providers: [CashierService],
  exports: [CashierService],
})
export class CashierServiceModule { }
