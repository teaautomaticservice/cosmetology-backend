import {
  CurrenciesRepositoryModule
} from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.module';
import { Module } from '@nestjs/common';

import { CurrenciesProvider } from './currencies.provider';

@Module({
  imports: [CurrenciesRepositoryModule],
  providers: [CurrenciesProvider],
  exports: [CurrenciesProvider],
})
export class CurrenciesProviderModule {}
