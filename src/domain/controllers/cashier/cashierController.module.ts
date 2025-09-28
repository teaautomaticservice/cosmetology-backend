import { Module } from '@nestjs/common';

import { CurrenciesControllerModule } from './currencies/currenciesController.module';

@Module({
  imports: [CurrenciesControllerModule],
})
export class CashierControllerModule {}