export enum TransactionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CANCELED = 'canceled',
  FAILED = 'failed',
  COMPLETED = 'completed',
  REVERSED = 'reversed',
};

export enum OperationType {
  OPENING_BALANCE = 'OBL',
  CLOSING_BALANCE = 'CBL',
  RECEIPT = 'RCP',
  CASH_OUT = 'CSH',
  TRANSFER = 'TRN',
  REFUND_IN = 'RFI',
  REFUND_OUT = 'RFO',
  LOAN = 'LON',
  LOAN_REPAYMENT = 'LOR',
  LOAN_OUTSIDE = 'LOO',
  LOAN_REPAYMENT_OUTSIDE = 'LRO',
  ADJUSTMENT = 'ADJ',
  WRITE_OFF = 'WRO',
  DEPRECATION = 'DPR',
};