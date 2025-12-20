import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { RESTRICTED_OBLIGATION_STORAGE_CODE_CHANGE_ERROR, VALIDATION_ERROR } from '@constants/errors';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { AccountsProvider } from '@providers/cashier/accounts/accounts.provider';
import {
  AccountsAggregatedWithStorage,
  SortAccountsByStorages,
  UpdateAccountsByIdsData
} from '@providers/cashier/accounts/accounts.type';
import { AccountsByStoreDto } from '@providers/cashier/accounts/dtos/accountByStore.dto';
import { AccountAggregatedWithStorageDto } from '@providers/cashier/accounts/dtos/accountsAggregatedWithStorage.dto';
import { AccountWithMoneyStorageDto } from '@providers/cashier/accounts/dtos/accountWithMoneyStorage.dto';
import { CurrenciesProvider } from '@providers/cashier/currencies/currencies.provider';
import { OBLIGATION_ACCOUNT_CODE } from '@providers/cashier/moneyStorages/moneyStorages.constants';
import { MoneyStoragesProvider } from '@providers/cashier/moneyStorages/moneyStorages.provider';
import { TransactionsProvider } from '@providers/cashier/transactions/transactions.provider';
import {
  FoundAndCounted,
  ID,
  Pagination,
  RecordEntity,
  Sort,
  UpdatedEntity
} from '@providers/common/common.type';
import { AccountEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import { CurrencyEntity } from '@providers/postgresql/repositories/cashier/currencies/currencies.entity';
import { CurrencyStatus } from '@providers/postgresql/repositories/cashier/currencies/currencies.types';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';

@Injectable()
export class CashierService {
  constructor(
    @Inject(Resources.LOGGER) protected readonly logger: Logger,
    private readonly currenciesProvider: CurrenciesProvider,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
    private readonly accountsProvider: AccountsProvider,
    private readonly transactionsProvider: TransactionsProvider,
  ) { }

  public async getCurrenciesList(params: { pagination: Pagination }): Promise<[CurrencyEntity[], number]> {
    return this.currenciesProvider.findAndCount(params);
  }

  public async createCurrency({
    data,
    pagination,
  }: {
    data: Pick<CurrencyEntity, 'code' | 'name'>;
    pagination: Pagination;
  }): Promise<[CurrencyEntity[], number]> {
    const result = await this.currenciesProvider.findByCode(data.code);
    if (result) {
      throw new BadRequestException(VALIDATION_ERROR, {
        cause: {
          code: ['Currencies with this code already exist'],
        },
      });
    }

    this.currenciesProvider.create({
      ...data,
      status: CurrencyStatus.ACTIVE,
    });
    return this.getCurrenciesList({ pagination });
  }

  public async getMoneyStoragesList({
    pagination,
  }: {
    pagination: Pagination;
    order?: Sort<keyof MoneyStoragesEntity>;
  }): Promise<[MoneyStoragesEntity[], number]> {
    return await this.moneyStoragesProvider.findAndCount({
      pagination,
    });
  }

  public async getObligationStorage(): Promise<MoneyStoragesEntity> {
    const result = await this.moneyStoragesProvider.findObligationStorage();
    if (!result) {
      throw new InternalServerErrorException('Obligation account hasn\'t find.');
    }
    return result;
  }

  public async updateMoneyStorage({
    currentId,
    newData,
  }: UpdatedEntity<MoneyStoragesEntity>): Promise<MoneyStoragesEntity> {
    const entity = await this.moneyStoragesProvider.findById(currentId);

    if (!entity) {
      throw new BadRequestException(`Incorrect ID: '${currentId}' for money storage`);
    }

    if (newData.code && entity.code === OBLIGATION_ACCOUNT_CODE && entity.code !== newData.code) {
      throw new BadRequestException(VALIDATION_ERROR, {
        cause: {
          code: [RESTRICTED_OBLIGATION_STORAGE_CODE_CHANGE_ERROR],
        },
      });
    }

    const result = await this.moneyStoragesProvider.updateById(currentId, newData);
    const updatedEntity = await this.moneyStoragesProvider.findById(currentId);

    if (!result || !updatedEntity) {
      this.logger.error('moneyStorage update error', {
        currentId,
        newData,
      });
      throw new InternalServerErrorException(`Money storage update error`);
    }

    this.logger.warn('moneyStorage update by user', {
      currentId,
      newData,
    });
    return updatedEntity;
  }

  public async createMoneyStorage(
    newData: Omit<RecordEntity<MoneyStoragesEntity>, 'status' | 'updatedBy' | 'createdBy'>,
  ): Promise<MoneyStoragesEntity> {
    const entity = await this.moneyStoragesProvider.findByCode(newData.code);

    if (entity) {
      throw new BadRequestException(VALIDATION_ERROR, {
        cause: {
          code: ['Money storage with this code already exist'],
        },
      });
    }

    const result = await this.moneyStoragesProvider.create(newData);

    this.logger.warn('moneyStorage created bu user', {
      newData,
      result,
    });

    return result;
  }

  public async removeMoneyStorage(currentId: ID): Promise<boolean> {
    const entity = await this.moneyStoragesProvider.findById(currentId);

    if (!entity) {
      throw new BadRequestException(`Incorrect ID: '${currentId}' for money storage`);
    }

    if (entity.status !== MoneyStorageStatus.DEACTIVATED && entity.status !== MoneyStorageStatus.CREATED) {
      throw new BadRequestException(
        'Delete money storage possible only created or deactivated status without transactions'
      );
    }

    this.logger.warn('moneyStorage deleted bu user', {
      entity,
    });

    return this.moneyStoragesProvider.deleteById(currentId);
  }

  public async getActualAccountsByMoneyStoragesList({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: Sort<SortAccountsByStorages>;
  }): Promise<FoundAndCounted<AccountsByStoreDto>> {
    const resp = await this.accountsProvider.getActualAccountsByStorageList({
      pagination,
      order,
    });

    return resp;
  }

  public async getAccountAggregatedWithStorageList({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: Sort<keyof AccountsAggregatedWithStorage>;
  }): Promise<FoundAndCounted<AccountAggregatedWithStorageDto>> {
    return this.accountsProvider.getAccountsAggregatedWithStorage({
      pagination,
      order,
    });
  }

  public async getActualAccountsList({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: Sort<keyof AccountEntity>;
  }): Promise<FoundAndCounted<AccountWithMoneyStorageDto>> {
    const resp = await this.accountsProvider.getActualAccountsWithStorage({
      pagination,
      order,
    });

    return resp;
  }

  public async createAccountsForStorages({
    data,
  }: {
    data: Pick<RecordEntity<AccountEntity>, 'name' | 'description' | 'currencyId'> & { moneyStorageIds: ID[] };
  }): Promise<FoundAndCounted<AccountWithMoneyStorageDto>> {
    const currency = await this.currenciesProvider.findById(data.currencyId);

    if (!currency || currency.status === CurrencyStatus.DISABLED) {
      throw new BadRequestException(VALIDATION_ERROR, {
        cause: {
          currencyId: [`Currency shout be is active`],
        },
      });
    }

    const moneyStorages = await this.moneyStoragesProvider.findByIdsWithFilter(
      data.moneyStorageIds,
      {
        filter: {
          status: [MoneyStorageStatus.FREEZED, MoneyStorageStatus.DEACTIVATED],
        }
      }
    );

    if (Boolean(moneyStorages?.length)) {
      throw new BadRequestException(VALIDATION_ERROR, {
        cause: {
          moneyStorageIds: [`Money storage can't be a freezed or deactivated`],
        },
      });
    }

    const promises = data.moneyStorageIds.map((moneyStorageId) => {
      return this.accountsProvider.createAccount({
        currencyId: data.currencyId,
        description: data.description,
        name: data.name,
        moneyStorageId,
      });
    });

    const createdRawAccounts = await Promise.all(promises);

    return this.accountsProvider.getActualAccountsWithStorage({
      pagination: {
        page: 1,
        pageSize: 10,
      },
      order: {
        status: 1,
      },
      filter: {
        ids: createdRawAccounts.map(({ id }) => id),
      }
    });;
  }

  public async updateAccount({
    currentId,
    newData,
  }: UpdatedEntity<AccountEntity>): Promise<AccountWithMoneyStorageDto> {
    const result = await this.accountsProvider.updateById(currentId, newData);
    const updatedEntity = await this.accountsProvider.findByIdEnrichmentData(currentId);

    if (!result || !updatedEntity) {
      this.logger.error('account update error', {
        currentId,
        newData,
      });
      throw new InternalServerErrorException(`Account update error`);
    }

    this.logger.warn('account update by user', {
      currentId,
      newData,
    });
    return updatedEntity;
  }

  public async multiplyUpdateAccounts({
    ids,
    ...data
  }: UpdateAccountsByIdsData & { ids: ID[] }): Promise<boolean> {
    return this.accountsProvider.updateByIds(ids, data);
  }

  public async removeAccount(accountId: ID): Promise<boolean> {
    const entity = await this.accountsProvider.findById(accountId);

    if (!entity) {
      throw new BadRequestException(`Incorrect ID: '${accountId}' for currency`);
    }

    if (!(entity.status === AccountStatus.CREATED || entity.status === AccountStatus.DEACTIVATED)) {
      throw new BadRequestException(
        'Delete account possible only for disabled or created status'
      );
    }

    if (Number(entity.balance) > 0 || Number(entity.available) > 0) {
      throw new BadRequestException(
        'Delete account possible only for empty balance and available'
      );
    }

    this.logger.warn('account deleted bu user', {
      entity,
    });

    return this.accountsProvider.deleteById(accountId);
  }

  public async removeCurrency(currentId: ID): Promise<boolean> {
    const entity = await this.currenciesProvider.findById(currentId);

    if (!entity) {
      throw new BadRequestException(`Incorrect ID: '${currentId}' for currency`);
    }

    if (entity.status !== CurrencyStatus.DISABLED) {
      throw new BadRequestException(
        'Delete currency possible only for disabled status'
      );
    }

    const [_, count] = await this.accountsProvider.getRawAccountsList({
      filter: {
        currenciesIds: [entity.id],
        status: [AccountStatus.ACTIVE, AccountStatus.FREEZED],
      },
      pagination: {
        page: 1,
        pageSize: 10,
      },
    });

    if (count > 0) {
      throw new BadRequestException(
        'Delete currency not possible for active or freezed accounts'
      );
    }

    this.logger.warn('currency deleted bu user', {
      entity,
    });

    return this.currenciesProvider.deleteById(currentId);
  }

  public async updateCurrency({
    currentId,
    newData,
  }: UpdatedEntity<CurrencyEntity>): Promise<CurrencyEntity> {
    const entity = await this.currenciesProvider.findById(currentId);

    if (!entity) {
      throw new BadRequestException(`Incorrect ID: '${currentId}' for currency`);
    }

    if (newData.status === CurrencyStatus.DISABLED) {
      const [_, countAccounts] = await this.accountsProvider.getRawAccountsList({
        pagination: {
          page: 1,
          pageSize: 10,
        },
        filter: {
          currenciesIds: [entity.id],
          notStatus: [AccountStatus.DEACTIVATED],
        },
      });

      if (countAccounts > 0) {
        throw new BadRequestException(
          'Deactivate currency possible only for disabled accounts'
        );
      }
    }
    const result = await this.currenciesProvider.updateById(currentId, newData);
    const updatedEntity = await this.currenciesProvider.findById(currentId);

    if (!result || !updatedEntity) {
      this.logger.error('currency update error', {
        currentId,
        newData,
      });
      throw new InternalServerErrorException(`Currency update error`);
    }

    this.logger.warn('currency update by user', {
      currentId,
      newData,
    });
    return updatedEntity;
  }

  public async getTransactionsList(): Promise<FoundAndCounted<TransactionEntity>> {
    const resp = await this.transactionsProvider.getTransactionsList();
    return resp;
  }
}