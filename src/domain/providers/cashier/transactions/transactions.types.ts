import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { ID, RecordEntity } from '@providers/common/common.type';

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

export type LoanRepaymentTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'debitId' |
  'creditId' |
  'description'
> & {
  creditObligationAccountId: number;
  amount: number;
}

export type TransactionsFilter = {
  ids?: ID[];
  parentTransactionIds?: string[];
  status?: TransactionEntity['status'][];
  notStatus?: TransactionEntity['status'][];
  debitIds?: ID[];
  creditIds?: ID[];
  anyAccountIds?: ID[];
  query?: string;
  amountFrom?: number;
  amountTo?: number;
}