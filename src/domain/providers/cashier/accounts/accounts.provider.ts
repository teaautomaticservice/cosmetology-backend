import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';
import { createdMapListFromEntity } from 'src/migrations/utils/createdMapListFromEntity';
import { In, Not } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { FoundAndCounted, Order, Pagination, RecordEntity } from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';
import { AccountsDb } from '@providers/postgresql/repositories/cashier/accounts/accounts.db';
import { AccountsEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

import { AccountsByStoreDto } from './dtos/accountByStore.dto';
import { AccountWithMoneyStorageDto } from './dtos/accountWithMoneyStorage.dto';
import { AccountsWithStorageFilter } from './accounts.type';
import { MoneyStoragesProvider } from '../moneyStorages/moneyStorages.provider';

@Injectable()
export class AccountsProvider extends CommonPostgresqlProvider<AccountsEntity> {
  constructor(
    private readonly accountsDb: AccountsDb,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
  ) {
    super(accountsDb);
  }

  public async getActualAccountsByStorageList({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: Order<MoneyStoragesEntity>;
  }): Promise<FoundAndCounted<AccountsByStoreDto>> {
    const [rawMoneyStorages, moneyStorageCount] = await this.moneyStoragesProvider.getActualMoneyStorage({
      pagination,
      order,
    });

    const moneyStoragesIds = rawMoneyStorages.map(({ id }) => id);

    const [rawAccountsList] = await super.findAndCount({
      pagination,
      where: {
        moneyStorageId: In(moneyStoragesIds),
      },
    });

    const accountMappedByMoneyStorages = createdMapListFromEntity(rawAccountsList, 'moneyStorageId');

    const accountByStore = rawMoneyStorages.map((moneyStorage) => {
      const accounts = accountMappedByMoneyStorages[moneyStorage.id] ?? [];
      return new AccountsByStoreDto({
        moneyStorage,
        accounts,
      });
    });

    return [accountByStore, moneyStorageCount];
  }

  public async getActualAccountsWithStorage({
    pagination,
    order,
    filter,
  }: {
    pagination: Pagination;
    order?: Order<AccountsEntity>;
    filter?: AccountsWithStorageFilter;
  }): Promise<FoundAndCounted<AccountWithMoneyStorageDto>> {
    const [rawMoneyStorages] = await this.moneyStoragesProvider.getActualMoneyStorage();

    const accountMappedByMoneyStorages = createdMapFromEntity(rawMoneyStorages);
    const moneyStoragesIds = rawMoneyStorages.map(({ id }) => id);

    const [rawAccountsList, accountListCount] = await this.gatRawAccountsList({
      pagination,
      order,
      filter: {
        moneyStoragesIds,
        ...filter,
      }
    });

    const accountsWithMoneyStorage = rawAccountsList.map((account) => {
      const moneyStorage = accountMappedByMoneyStorages[account.moneyStorageId] ?? null;
      return new AccountWithMoneyStorageDto({
        account,
        moneyStorage,
      });
    });

    return [accountsWithMoneyStorage, accountListCount];
  }

  public async gatRawAccountsList({
    pagination,
    order,
    filter,
  }: {
    pagination: Pagination;
    order?: Order<AccountsEntity>;
    filter?: AccountsWithStorageFilter;
  }): Promise<FoundAndCounted<AccountsEntity>> {
    return super.findAndCount({
      pagination,
      where: {
        ...(filter?.moneyStoragesIds && { moneyStorageId: In(filter.moneyStoragesIds) }),
        ...(filter?.currenciesIds && { currencyId: In(filter.currenciesIds) }),
        ...(filter?.status && { status: In(filter.status) }),
        ...(filter?.notStatus && { status: Not(In(filter.notStatus)) }),
        ...(filter?.ids && { id: In(filter.ids) }),
      },
      order,
    });
  }

  public async findById(id: number): Promise<AccountsEntity | null> {
    return super.findById(id);
  }

  public async createAccount(data: Omit<RecordEntity<AccountsEntity>, 'balance' | 'available' | 'status'>): Promise<AccountsEntity> {
    return super.create({
      ...data,
      balance: 0,
      available: 0,
      status: AccountStatus.CREATED,
    });
  }
}