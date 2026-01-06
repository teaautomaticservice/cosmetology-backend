import { OperationType } from '@postgresql/repositories/cashier/transactions/transactions.types';

export const incomeTransactionTypes = [
  OperationType.OPENING_BALANCE,
  OperationType.RECEIPT,
  OperationType.REFUND_IN,
  OperationType.LOAN_OUTSIDE,
  OperationType.ADJUSTMENT,
];
export const expendTransactionTypes = [
  OperationType.CLOSING_BALANCE,
  OperationType.CASH_OUT,
  OperationType.REFUND_OUT,
  OperationType.LOAN_REPAYMENT_OUTSIDE,
  OperationType.WRITE_OFF,
  OperationType.DEPRECATION,
  OperationType.ADJUSTMENT,
];
export const transferTransactionTypes = [
  OperationType.TRANSFER,
  OperationType.LOAN,
  OperationType.LOAN_REPAYMENT,

];