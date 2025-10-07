import { FindOptionsOrder, Not } from 'typeorm';

import { FoundAndCounted, Pagination, RecordEntity } from '@domain/providers/common/common.type';
import { Injectable } from '@nestjs/common';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';
import { MoneyStoragesDb } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.db';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

import { OBLIGATION_ACCOUNT_CODE } from './moneyStorages.constants';

@Injectable()
export class MoneyStoragesProvider extends CommonPostgresqlProvider<MoneyStoragesEntity> {
  constructor(private readonly moneyStoragesDb: MoneyStoragesDb) {
    super(moneyStoragesDb);
  }

  public async create(data: RecordEntity<MoneyStoragesEntity>): Promise<MoneyStoragesEntity> {
    const formattedCode = data.code.toUpperCase();
    return this.moneyStoragesDb.create({
      ...data,
      code: formattedCode,
    });
  }

  public async findByCode(code: MoneyStoragesEntity['code']): Promise<MoneyStoragesEntity | null> {
    const formattedCode = code.toUpperCase();
    return this.moneyStoragesDb.findOne({
      where: {
        code: formattedCode,
      },
    });
  }

  public async findAndCount({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: FindOptionsOrder<MoneyStoragesEntity> | undefined;
  }): Promise<FoundAndCounted<MoneyStoragesEntity>> {
    return super.findAndCount({
      pagination,
      order,
      where: {
        code: Not(OBLIGATION_ACCOUNT_CODE),
      }
    });
  }

  public async findObligationAccount(): Promise<MoneyStoragesEntity | null> {
    return this.findByCode(OBLIGATION_ACCOUNT_CODE);
  }
}