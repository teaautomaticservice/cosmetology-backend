import { CashierServiceModule } from '@domain/services/cashier/cashierService.module';
import { Module } from '@nestjs/common';

import { CurrenciesController } from './currencies.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [CurrenciesController],
})
export class CurrenciesControllerModule {}