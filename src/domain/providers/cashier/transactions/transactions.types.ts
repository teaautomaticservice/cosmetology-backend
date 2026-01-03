import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { RecordEntity } from '@providers/common/common.type';

export type CreateTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & { amount: number }

export type CreateOpenBalanceObligationTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'description'
> & {
  debitName: string;
  obligationStorageId: number;
  currencyId: number;
  amount: number;
}

export type LoanTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & {
  obligationStorageId: number;
  amount: number;
}