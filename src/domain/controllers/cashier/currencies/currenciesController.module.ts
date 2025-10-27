import { Module } from '@nestjs/common';
import { CashierServiceModule } from '@services/cashier/cashierService.module';

import { CurrenciesController } from './currencies.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [CurrenciesController],
})
export class CurrenciesControllerModule {}