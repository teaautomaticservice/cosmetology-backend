import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { RESTRICTED_OBLIGATION_STORAGE_CODE_CHANGE_ERROR, VALIDATION_ERROR } from '@constants/errors';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { AccountsProvider } from '@providers/cashier/accounts/accounts.provider';
import { SortAccountsByStorages } from '@providers/cashier/accounts/accounts.type';
import { AccountsByStoreDto } from '@providers/cashier/accounts/dtos/accountByStore.dto';
import { AccountWithMoneyStorageDto } from '@providers/cashier/accounts/dtos/accountWithMoneyStorage.dto';
import { CurrenciesProvider } from '@providers/cashier/currencies/currencies.provider';
import { OBLIGATION_ACCOUNT_CODE } from '@providers/cashier/moneyStorages/moneyStorages.constants';
import { MoneyStoragesProvider } from '@providers/cashier/moneyStorages/moneyStorages.provider';
import {
  FoundAndCounted,
  ID,
  Pagination,
  RecordEntity,
  Sort,
  UpdatedEntity
} from '@providers/common/common.type';
import { AccountsEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
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

  public async getObligationAccount(): Promise<MoneyStoragesEntity> {
    const result = await this.moneyStoragesProvider.findObligationAccount();
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

  public async getActualAccountsList({
    pagination,
    order,
  }: {
    pagination: Pagination;
    order?: Sort<keyof AccountsEntity>;
  }): Promise<FoundAndCounted<AccountWithMoneyStorageDto>> {
    const resp = await this.accountsProvider.getActualAccountsWithStorage({
      pagination,
      order,
    });

    return resp;
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

    const [_, count] = await this.accountsProvider.gatRawAccountsList({
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

    return this.currenciesProvider.deleteById(currentId);
  }
}