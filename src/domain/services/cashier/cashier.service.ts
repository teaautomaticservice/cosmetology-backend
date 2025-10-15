import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { RESTRICTED_OBLIGATION_STORAGE_CODE_CHANGE_ERROR, VALIDATION_ERROR } from '@domain/constants/errors';
import { CurrenciesProvider } from '@domain/providers/cashier/currencies/currencies.provider';
import { OBLIGATION_ACCOUNT_CODE } from '@domain/providers/cashier/moneyStorages/moneyStorages.constants';
import { MoneyStoragesProvider } from '@domain/providers/cashier/moneyStorages/moneyStorages.provider';
import { ID, Pagination, RecordEntity, UpdatedEntity } from '@domain/providers/common/common.type';
import { CurrencyEntity } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.entity';
import { CurrencyStatus } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.types';
import {
  MoneyStoragesEntity
} from '@domain/providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus
} from '@domain/providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class CashierService {
  constructor(
    private readonly currenciesProvider: CurrenciesProvider,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
    @Inject(Resources.LOGGER) protected readonly logger: Logger,
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

    return this.moneyStoragesProvider.deleteById(currentId);
  }
}