import { createdMapListFromEntity } from 'src/migrations/utils/createdMapListFromEntity';
import { In } from 'typeorm';

import { FoundAndCounted, Pagination } from '@domain/providers/common/common.type';
import { CommonPostgresqlProvider } from '@domain/providers/common/commonPostgresql.provider';
import { AccountsDb } from '@domain/providers/postgresql/repositories/cashier/accounts/accounts.db';
import { AccountsEntity } from '@domain/providers/postgresql/repositories/cashier/accounts/accounts.entity';
import {
  MoneyStorageStatus
} from '@domain/providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { Injectable } from '@nestjs/common';

import { AccountsByStoreDto } from './dtos/accountByStore.dto';
import { MoneyStoragesProvider } from '../moneyStorages/moneyStorages.provider';

@Injectable()
export class AccountsProvider extends CommonPostgresqlProvider<AccountsEntity> {
  constructor(
    private readonly accountsDb: AccountsDb,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
  ) {
    super(accountsDb);
  }

  public async getAccountsByStorageList({
    pagination,
  }: {
    pagination: Pagination;
  }): Promise<FoundAndCounted<AccountsByStoreDto>> {
    const [rawMoneyStorages, moneyStorageCount] = await this.moneyStoragesProvider.findAndCount({
      pagination,
      filter: {
        status: [MoneyStorageStatus.ACTIVE, MoneyStorageStatus.FREEZED],
      }
    });

    const moneyStoragesIds = rawMoneyStorages.map(({ id }) => id);

    const [rawAccountsList] = await super.findAndCount({
      pagination,
      where: {
        moneyStorageId: In(moneyStoragesIds)
      }
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
}