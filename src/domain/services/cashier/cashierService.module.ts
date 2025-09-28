import { CurrenciesProviderModule } from '@domain/providers/cashier/currencies/currenciesProvider.module';
import { Module } from '@nestjs/common';

import { CashierService } from './cashier.service';

@Module({
  imports: [
    CurrenciesProviderModule,
  ],
  providers: [CashierService],
  exports: [CashierService],
})
export class CashierServiceModule {}
