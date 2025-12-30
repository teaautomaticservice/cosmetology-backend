import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';
import { createdMapListFromEntity } from 'src/migrations/utils/createdMapListFromEntity';
import { ILike, In, Not } from 'typeorm';

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import {
  FoundAndCounted,
  ID,
  Order,
  Pagination,
  RecordEntity,
  Sort
} from '@providers/common/common.type';
import { CommonPostgresqlProvider } from '@providers/common/commonPostgresql.provider';
import { AccountsDb } from '@providers/postgresql/repositories/cashier/accounts/accounts.db';
import { AccountEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import { normalizeString } from '@utils/normalizeString';

import { AccountsByStoreDto } from './dtos/accountByStore.dto';
import { AccountAggregatedWithStorageDto } from './dtos/accountsAggregatedWithStorage.dto';
import { AccountWithMoneyStorageDto } from './dtos/accountWithMoneyStorage.dto';
import {
  AccountsAggregatedWithStorage,
  AccountsWithStorageFilter,
  EnrichedAccountData,
  UpdateAccountsByIdsData
} from './accounts.type';
import { CurrenciesProvider } from '../currencies/currencies.provider';
import { MoneyStoragesProvider } from '../moneyStorages/moneyStorages.provider';

@Injectable()
export class AccountsProvider extends CommonPostgresqlProvider<AccountEntity> {
  constructor(
    private readonly accountsDb: AccountsDb,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
    private readonly currenciesProvider: CurrenciesProvider,
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
      pagination: {
        page: 1,
        pageSize: (100000 * moneyStorageCount),
      },
      where: {
        moneyStorageId: In(moneyStoragesIds),
      },
    });

    const enrichedAccounts = await this.accountsEnrichment(rawAccountsList);

    const accountMappedByMoneyStorages = createdMapListFromEntity(enrichedAccounts, 'moneyStorageId');

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
    order?: Order<AccountEntity>;
    filter?: AccountsWithStorageFilter;
  }): Promise<FoundAndCounted<AccountWithMoneyStorageDto>> {
    const [rawMoneyStorages] = await this.moneyStoragesProvider.getActualMoneyStorage();

    const moneyStoragesIds = rawMoneyStorages.map(({ id }) => id);

    const [rawAccountsList, accountListCount] = await this.getRawAccountsList({
      pagination,
      order,
      filter: {
        moneyStoragesIds,
        ...filter,
      },
    });

    const enrichedAccounts = await this.accountsEnrichment(rawAccountsList);

    const accountsWithMoneyStorage = enrichedAccounts.map((account) => {
      const moneyStorage = account.moneyStorage ?? null;
      const currency = account.currency;
      return new AccountWithMoneyStorageDto({
        account,
        moneyStorage,
        currency,
      });
    });

    return [accountsWithMoneyStorage, accountListCount];
  }

  public async getAccountsAggregatedWithStorage({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: Sort<keyof AccountsAggregatedWithStorage>;
  }): Promise<FoundAndCounted<AccountAggregatedWithStorageDto>> {
    const groupBy: (keyof AccountEntity)[] = ['name', 'status', 'currencyId'];

    const [rawAggregatedAccount, count] = await Promise.all([
      this.accountsDb.aggregate({
        ...this.getOffset(pagination),
        order,
        groupBy,
        select: ['name', 'status', 'currencyId'],
        aggregates: {
          ids: {
            field: 'id',
            fn: 'ARRAY_AGG',
          },
          balance: {
            field: 'balance',
            fn: 'SUM',
          },
          available: {
            field: 'available',
            fn: 'SUM',
          },
          moneyStorageIds: {
            field: 'moneyStorageId',
            fn: 'ARRAY_AGG',
          },
        },
      }),
      this.accountsDb.aggregateCount({
        groupBy,
      }),
    ]);

    const enrichedAccounts = await this.accountsEnrichment(rawAggregatedAccount);

    const resp = enrichedAccounts.map((account) => {
      const currency = account.currency;
      const moneyStorages = account.moneyStorages;

      if (!currency || !moneyStorages || (moneyStorages && moneyStorages.length === 0)) {
        throw new InternalServerErrorException('AccountsAggregatedWithStorage error data enrichment');
      }

      return new AccountAggregatedWithStorageDto({
        account,
        currency,
        moneyStorages: moneyStorages,
      });
    });

    return [resp, count];
  }

  public async getRawAccountsList({
    pagination,
    order,
    filter,
  }: {
    pagination: Pagination;
    order?: Order<AccountEntity>;
    filter?: AccountsWithStorageFilter;
  }): Promise<FoundAndCounted<AccountEntity>> {
    return super.findAndCount({
      pagination,
      where: [
        ...(filter?.query && AccountEntity.checkLikeId(filter?.query) ? [{ id: Number(filter.query) }] : []),
        {
          ...(filter?.name && { name: filter.name }),
          ...(filter?.query ? { name: ILike(`%${filter.query}%`) } : {}),
          ...(filter?.moneyStoragesIds && { moneyStorageId: In(filter.moneyStoragesIds) }),
          ...(filter?.currenciesIds && { currencyId: In(filter.currenciesIds) }),
          ...(filter?.status && { status: In(filter.status) }),
          ...(filter?.notStatus && { status: Not(In(filter.notStatus)) }),
          ...(filter?.ids && { id: In(filter.ids) }),
        },
      ],
      order,
    });
  }

  public async findById(id: number): Promise<AccountEntity | null> {
    return super.findById(id);
  }

  public async findByIdEnrichmentData(id: number): Promise<AccountWithMoneyStorageDto | null> {
    const account = await this.findById(id);

    if (!account) {
      return null;
    }

    const resp = await this.accountsEnrichment([account]);
    const enrichedAccount = resp[0];

    return new AccountWithMoneyStorageDto({
      account: enrichedAccount,
      currency: enrichedAccount.currency,
      moneyStorage: enrichedAccount.moneyStorage ?? null,
    });
  }

  public async createAccount(data: Omit<RecordEntity<AccountEntity>, 'balance' | 'available' | 'status'>): Promise<AccountEntity> {
    const formattedData = {
      ...data,
      name: normalizeString(data.name),
    };
    await this.checkDuplicate(formattedData);

    return super.create({
      ...formattedData,
      balance: '0',
      available: '0',
      status: AccountStatus.CREATED,
    });
  }

  public async deleteById(currentId: ID): Promise<boolean> {
    await this.accountsDb.deleteById(currentId);
    return true;
  }

  public async updateById(id: number, data: Partial<RecordEntity<AccountEntity>>): Promise<boolean> {
    const entity = await super.findById(id);

    if (!entity) {
      throw new InternalServerErrorException(`Error update account by id: ${id}`);
    }

    const formattedData = {
      ...data,
      ...(data.name ? { name: normalizeString(data.name) } : undefined),
    };

    await this.checkDuplicate({
      ...entity,
      ...formattedData,
    });

    return super.updateById(id, formattedData);
  }

  public async updateByIds(ids: ID[], data: UpdateAccountsByIdsData): Promise<boolean> {
    return super.updateByIds(ids, data);
  }

  private async accountsEnrichment<T extends {
    moneyStorageId?: ID;
    moneyStorageIds?: ID[];
    currencyId?: ID;
  }>(rawAccounts: T[]): Promise<(EnrichedAccountData<T>)[]> {
    const uniqIdsMoneyStorages: Set<ID> = new Set();
    const uniqIdsCurrencies: Set<ID> = new Set();

    rawAccounts.forEach((rawAccount) => {
      if (rawAccount.moneyStorageId) {
        uniqIdsMoneyStorages.add(rawAccount.moneyStorageId);
      }

      if (rawAccount.moneyStorageIds) {
        rawAccount.moneyStorageIds.forEach((id) => uniqIdsMoneyStorages.add(id));
      }

      if (rawAccount.currencyId) {
        uniqIdsCurrencies.add(rawAccount.currencyId);
      }
    });

    const [
      rawMoneyStorages,
      rawCurrencies,
    ] = await Promise.all([
      this.moneyStoragesProvider.findByIdsWithFilter(Array.from(uniqIdsMoneyStorages)),
      this.currenciesProvider.findByIds(Array.from(uniqIdsCurrencies)),
    ]);

    const mappedMoneyStorages = createdMapFromEntity(rawMoneyStorages ?? []);
    const mappedCurrencies = createdMapFromEntity(rawCurrencies ?? []);

    const enrichmentAccounts = rawAccounts.map((rawAccount) => {
      const newData: EnrichedAccountData<T> = {
        ...rawAccount,
      };

      newData.moneyStorage = rawAccount.moneyStorageId ?
        mappedMoneyStorages[rawAccount.moneyStorageId] :
        undefined;
      newData.currency = rawAccount.currencyId ?
        mappedCurrencies[rawAccount.currencyId] :
        undefined;
      newData.moneyStorages = rawAccount.moneyStorageIds ?
        rawAccount.moneyStorageIds
          .map((id) => mappedMoneyStorages[id])
          .filter((el) => Boolean(el)) as MoneyStoragesEntity[] :
        undefined;

      return newData;
    });

    return enrichmentAccounts;
  }

  private async checkDuplicate({
    id,
    name,
    currencyId,
    moneyStorageId,
  }: Pick<AccountEntity, 'name' | 'currencyId' | 'moneyStorageId'> & { id?: ID }): Promise<boolean> {
    const [accounts, count] = await super.findAndCount({
      pagination: {
        page: 1,
        pageSize: 1,
      },
      where: {
        name: ILike(normalizeString(name)),
        currencyId,
        moneyStorageId,
      }
    });

    let hasDuplicate = false;

    if (!Boolean(id) && count > 0) {
      hasDuplicate = true;
    }

    if (Boolean(id) && count === 1 && accounts[0]?.id !== id) {
      hasDuplicate = true;
    }

    if (count > 1) {
      hasDuplicate = true;
    }

    if (hasDuplicate) {
      throw new BadRequestException(
        `Account with the same name'${name}',
        currencyId '${currencyId}' and
        moneyStorageId '${moneyStorageId} already exist`
      );
    }

    return true;
  }
}