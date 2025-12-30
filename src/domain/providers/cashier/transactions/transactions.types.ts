import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { RecordEntity } from '@providers/common/common.type';

export type CreateTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & { amount: number }