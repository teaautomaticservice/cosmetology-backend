import { Module } from '@nestjs/common';
import { CashierServiceModule } from '@services/cashier/cashierService.module';

import { TransactionsController } from './transactions.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [TransactionsController],
})
export class TransactionsControllerModule {}