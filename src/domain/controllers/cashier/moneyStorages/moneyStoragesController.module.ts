import { Module } from '@nestjs/common';
import { CashierServiceModule } from '@services/cashier/cashierService.module';

import { MoneyStoragesController } from './moneyStorages.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [MoneyStoragesController],
})
export class MoneyStoragesControllerModule {}