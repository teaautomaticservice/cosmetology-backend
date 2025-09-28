import {
  CurrenciesRepositoryModule
} from '@domain/providers/postgresql/repositories/cashier/currencies/CurrenciesDb.module';
import { Module } from '@nestjs/common';

import { CurrenciesController } from './currencies.controller';

@Module({
  imports: [CurrenciesRepositoryModule],
  controllers: [CurrenciesController],
})
export class CurrenciesControllerModule {}