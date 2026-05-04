import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { RecordEntity } from '@providers/common/common.type';

export type CreateOpenBalanceObligationTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'description'
> & {
  debitName: string;
  obligationStorageId: number;
  currencyId: number;
  amount: number;
}