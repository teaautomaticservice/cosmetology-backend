import { Module } from '@nestjs/common';
import {
  MoneyStoragesRepositoryModule,
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.module';

import { MoneyStoragesProvider } from './moneyStorages.provider';

@Module({
  imports: [MoneyStoragesRepositoryModule],
  providers: [MoneyStoragesProvider],
  exports: [MoneyStoragesProvider],
})
export class MoneyStoragesProviderModule {}
