import { CashierServiceModule } from '@domain/services/cashier/cashierService.module';
import { Module } from '@nestjs/common';

import { MoneyStoragesController } from './moneyStorages.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [MoneyStoragesController],
})
export class MoneyStoragesControllerModule {}