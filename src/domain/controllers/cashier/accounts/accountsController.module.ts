import { CashierServiceModule } from '@domain/services/cashier/cashierService.module';
import { Module } from '@nestjs/common';

import { AccountsController } from './accounts.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [AccountsController],
})
export class AccountsControllerModule {}