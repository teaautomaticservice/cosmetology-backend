import { v4 as uuid } from 'uuid';

import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { CommonTxOps } from '@providers/common/common.txOps';
import { ID, RecordEntity, TxOpsDeps } from '@providers/common/common.type';
import { TransactionEntity } from '@providers/postgresql/repositories/cashier/transactions/transactions.entity';

type CreateTransactionData = {
  amount: string;
  operationType: OperationType;
  debitId?: ID | null;
  creditId?: ID | null;
  parentTransactionId?: string | null;
  description?: string | null;
}

export class TransactionsTxOps extends CommonTxOps<TransactionEntity> {
  constructor(deps: TxOpsDeps) {
    super(deps, TransactionEntity, 'transaction');
  }

  public async createTransaction(data: CreateTransactionData): Promise<TransactionEntity> {
    return super.create({
      transactionId: this.generateTransactionId(),
      parentTransactionId: data.parentTransactionId ?? null,
      amount: data.amount,
      debitId: data.debitId ?? null,
      creditId: data.creditId ?? null,
      status: TransactionStatus.COMPLETED,
      operationType: data.operationType,
      executionDate: new Date(),
      description: data.description ?? null,
    } as RecordEntity<TransactionEntity>);
  }

  public async lastDebitTransaction({
    debitId
  }: {
    debitId: ID;
  }): Promise<TransactionEntity | null> {
    return super.findOne({
      where: {
        debitId,
      },
      order: {
        createdAt: -1,
      },
    });
  }

  public async findByTransactionId(
    transactionId: TransactionEntity['transactionId'],
    { forUpdate }: { forUpdate?: boolean } = {},
  ): Promise<TransactionEntity | null> {
    return super.findOne({
      where: { transactionId },
      forUpdate,
    });
  }

  public async sumByParent(
    parentTransactionId: NonNullable<TransactionEntity['parentTransactionId']>,
    {
      operationType,
    }: {
      operationType?: OperationType;
    } = {},
  ): Promise<string> {
    const [row] = await super.aggregate({
      where: {
        parentTransactionId,
        operationType,
      },
      aggregates: {
        total: {
          field: 'amount',
          fn: 'SUM',
        },
      },
    });

    return row?.total ?? '0';
  }

  private generateTransactionId(): string {
    const year = new Date().getFullYear();
    const additionalId = uuid().replace(/-/g, '').substring(0, 12).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TXN-${year}-${timestamp}${additionalId}`;
  }
}