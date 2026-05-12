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
};

export type CreateTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & { amount: number };

export type LoanTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & {
  obligationStorageId: number;
  amount: number;
};

export type LoanRepaymentTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & {
  creditObligationAccountId: number;
  amount: number;
};

export type LentTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'creditId' |
  'description'
> & {
  creditObligationStorageId: number;
  amount: number;
};

export type LentRepaymentTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'description'
> & {
  obligationAccountId: number;
  amount: number;
};

export type RefundOutTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'transactionId' |
  'description'
> & { amount: number };