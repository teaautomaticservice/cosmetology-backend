import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { ID, RecordEntity } from '@providers/common/common.type';

export type RefundInTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'transactionId' |
  'description'
> & { amount: number }

export type RefundOutTransaction = Pick<RecordEntity<
  TransactionEntity>,
  'transactionId' |
  'description'
> & { amount: number }

export type TransactionsFilter = {
  parentTransactionIds?: string[];
  status?: TransactionEntity['status'][];
  notStatus?: TransactionEntity['status'][];
  debitIds?: ID[];
  creditIds?: ID[];
  anyAccountIds?: ID[];
  query?: string;
  amountFrom?: number;
  amountTo?: number;
  anyId?: string;
  operationTypes?: OperationType[];
}
