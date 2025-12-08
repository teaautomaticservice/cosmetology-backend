import { Module } from '@nestjs/common';

import { AccountsControllerModule } from './accounts/accountsController.module';
import { CurrenciesControllerModule } from './currencies/currenciesController.module';
import { MoneyStoragesControllerModule } from './moneyStorages/moneyStoragesController.module';
import { TransactionsControllerModule } from './transactions/transactionsController';

@Module({
  imports: [
    CurrenciesControllerModule,
    MoneyStoragesControllerModule,
    AccountsControllerModule,
    TransactionsControllerModule,
  ],
})
export class CashierControllerModule {}