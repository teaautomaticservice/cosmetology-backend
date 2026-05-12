import {
  And,
  FindOperator,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not
} from 'typeorm';

import { Injectable } from '@nestjs/common';
import { TransactionsDb } from '@postgresql/repositories/cashier/transactions/transactions.db';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { Where } from '@postgresql/repositories/common/common.types';
import {
  FoundAndCounted,
  Pagination,
  TxOpsDeps
} from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';

import { TransactionsTxOps } from './transactions.txOps';
import { TransactionsFilter } from './transactions.types';

@Injectable()
export class TransactionsProvider extends CommonPostgresqlProvider<TransactionEntity> {
  constructor(
    private readonly transactionsDb: TransactionsDb,
  ) {
    super(transactionsDb);
  }

  public async getTransactionsList({
    pagination,
    filter,
  }: {
    pagination: Pagination;
    filter?: TransactionsFilter;
  }): Promise<FoundAndCounted<TransactionEntity>> {
    const getStatusWhere = (): FindOperator<TransactionStatus> | undefined => {
      if (filter?.status && filter?.notStatus) {
        return And(
          In(filter.status),
          Not(In(filter.notStatus)),
        );
      }

      if (filter?.status) {
        return In(filter.status);
      }

      if (filter?.notStatus) {
        return Not(In(filter.notStatus));
      }
    };

    const getAmountWhere = (): FindOperator<string> | undefined => {
      if (filter?.amountFrom && filter?.amountTo) {
        return And(
          MoreThanOrEqual(filter.amountFrom.toString()),
          LessThanOrEqual(filter.amountTo.toString()),
        );
      }

      if (filter?.amountFrom) {
        return MoreThanOrEqual(filter.amountFrom.toString());
      }

      if (filter?.amountTo) {
        return LessThanOrEqual(filter.amountTo.toString());
      }
    };

    const baseWhere: Where<TransactionEntity> = {
      parentTransactionId: filter?.parentTransactionIds && In(filter.parentTransactionIds),
      status: getStatusWhere(),
      debitId: filter?.debitIds && In(filter.debitIds),
      creditId: filter?.creditIds && In(filter.creditIds),
      amount: getAmountWhere(),
      operationType: filter?.operationTypes && In(filter.operationTypes),
    };

    const hasAnd = filter?.query ||
      filter?.anyAccountIds ||
      filter?.anyId;

    return super.findAndCount({
      pagination,
      relations: ['debitAccount', 'creditAccount'],
      where: hasAnd ? [
        {
          ...baseWhere,
          description: filter?.query && ILike(`%${filter.query}%`),
          debitId: filter?.anyAccountIds && In(filter.anyAccountIds),
          transactionId: filter?.anyId,
        },
        {
          ...baseWhere,
          transactionId: filter?.query && ILike(`%${filter.query}%`),
          creditId: filter?.anyAccountIds && In(filter.anyAccountIds),
          parentTransactionId: filter?.anyId,
        }
      ] : baseWhere
    });
  }

  public forTx(deps: TxOpsDeps): TransactionsTxOps {
    return new TransactionsTxOps(deps);
  }
}
