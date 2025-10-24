import { Module } from '@nestjs/common';

import { AccountsControllerModule } from './accounts/accountsController.module';
import { CurrenciesControllerModule } from './currencies/currenciesController.module';
import { MoneyStoragesControllerModule } from './moneyStorages/moneyStoragesController.module';

@Module({
  imports: [
    CurrenciesControllerModule,
    MoneyStoragesControllerModule,
    AccountsControllerModule,
  ],
})
export class CashierControllerModule {}