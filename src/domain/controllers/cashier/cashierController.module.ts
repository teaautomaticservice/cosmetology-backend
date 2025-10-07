import { Module } from '@nestjs/common';

import { CurrenciesControllerModule } from './currencies/currenciesController.module';
import { MoneyStoragesControllerModule } from './moneyStorages/moneyStoragesController.module';

@Module({
  imports: [
    CurrenciesControllerModule,
    MoneyStoragesControllerModule,
  ],
})
export class CashierControllerModule {}