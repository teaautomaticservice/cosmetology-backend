import { Module } from '@nestjs/common';
import { CashierServiceModule } from '@services/cashier/cashierService.module';

import { AccountsController } from './accounts.controller';

@Module({
  imports: [CashierServiceModule],
  controllers: [AccountsController],
})
export class AccountsControllerModule {}