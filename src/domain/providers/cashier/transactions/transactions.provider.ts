import { Injectable } from '@nestjs/common';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { FoundAndCounted } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

@Injectable()
export class TransactionsProvider extends CommonPostgresqlProvider<TransactionEntity> {
  constructor(
    private readonly transactionsDb: TransactionsDb,
  ) {
    super(transactionsDb);
  }

  public async getTransactionsList(): Promise<FoundAndCounted<TransactionEntity>> {
    return super.findAndCount({
      pagination: {
        page: 1,
        pageSize: 10,
      },
      relations: ['debitAccount', 'creditAccount']
    });
  }
}