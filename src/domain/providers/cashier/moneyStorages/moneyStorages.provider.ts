import { FindOptionsOrder, In, Not } from 'typeorm';

import { RESTRICTED_OBLIGATION_STORAGE_CODE_CHANGE_ERROR } from '@constants/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  FoundAndCounted,
  ID,
  Order,
  Pagination,
  RecordEntity
} from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';
import { MoneyStoragesDb } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.db';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';

import { OBLIGATION_ACCOUNT_CODE } from './moneyStorages.constants';
import { MoneyStoragesFilter } from './moneyStorages.types';

@Injectable()
export class MoneyStoragesProvider extends CommonPostgresqlProvider<MoneyStoragesEntity> {
  constructor(private readonly moneyStoragesDb: MoneyStoragesDb) {
    super(moneyStoragesDb);
  }

  public async create(data: Omit<RecordEntity<MoneyStoragesEntity>, 'status'>): Promise<MoneyStoragesEntity> {
    const formattedCode = data.code.toUpperCase();
    return this.moneyStoragesDb.create({
      ...data,
      code: formattedCode,
      status: MoneyStorageStatus.CREATED,
    });
  }

  public async findByCode(code: MoneyStoragesEntity['code']): Promise<MoneyStoragesEntity | null> {
    const formattedCode = code.toUpperCase().replace(/\s/g, '');
    return this.moneyStoragesDb.findOne({
      where: {
        code: formattedCode,
      },
    });
  }

  public async findAndCount({
    pagination,
    filter = {},
    order,
  }: {
    pagination: Pagination;
    filter?: MoneyStoragesFilter;
    order?: FindOptionsOrder<MoneyStoragesEntity>;
  }): Promise<FoundAndCounted<MoneyStoragesEntity>> {
    const {
      status,
    } = filter;

    return super.findAndCount({
      pagination,
      order,
      where: {
        code: Not(OBLIGATION_ACCOUNT_CODE),
        ...(status && Boolean(status?.length) && { status: In(status) }),
      }
    });
  }

  public async findObligationAccount(): Promise<MoneyStoragesEntity | null> {
    return this.findByCode(OBLIGATION_ACCOUNT_CODE);
  }

  public async updateById(id: number, data: Partial<RecordEntity<MoneyStoragesEntity>>): Promise<boolean> {
    const entity = await this.findById(id);

    if (!entity) {
      throw new InternalServerErrorException(`Incorrect ID: '${id}' for money storage`);
    }

    if (data.code && entity.code === OBLIGATION_ACCOUNT_CODE && data.code !== OBLIGATION_ACCOUNT_CODE) {
      throw new InternalServerErrorException(RESTRICTED_OBLIGATION_STORAGE_CODE_CHANGE_ERROR);
    }

    const formattedCode = data.code ? data.code.toUpperCase() : undefined;

    return super.updateById(id, {
      ...data,
      code: formattedCode,
    });
  }

  public async deleteById(currentId: ID): Promise<boolean> {
    await this.moneyStoragesDb.deleteById(currentId);
    return true;
  }

  public async getActualMoneyStorage({
    pagination,
    order,
  }: {
    pagination?: Pagination;
    order?: Order<MoneyStoragesEntity>;
  } = {}): Promise<FoundAndCounted<MoneyStoragesEntity>> {
    return this.findAndCount({
      pagination: {
        page: pagination?.page ?? 1,
        pageSize: pagination?.pageSize ?? 1000000,
      },
      filter: {
        status: [MoneyStorageStatus.ACTIVE, MoneyStorageStatus.FREEZED],
      },
      order,
    });
  }

  public async findById(id: number): Promise<MoneyStoragesEntity | null> {
    return super.findById(id);
  }
}