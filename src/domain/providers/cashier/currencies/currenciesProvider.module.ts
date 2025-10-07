import { Module } from '@nestjs/common';
import {
  CurrenciesRepositoryModule
} from '@providers/postgresql/repositories/cashier/currencies/currencies.module';

import { CurrenciesProvider } from './currencies.provider';

@Module({
  imports: [CurrenciesRepositoryModule],
  providers: [CurrenciesProvider],
  exports: [CurrenciesProvider],
})
export class CurrenciesProviderModule {}
