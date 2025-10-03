import { CurrenciesProvider } from '@domain/providers/cashier/currencies/currencies.provider';
import { MoneyStoragesProvider } from '@domain/providers/cashier/moneyStorages/moneyStorages.provider';
import { Pagination } from '@domain/providers/common/common.type';
import { CurrencyEntity } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.entity';
import { CurrencyStatus } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.types';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class CashierService {
  constructor(
    private readonly currenciesProvider: CurrenciesProvider,
    private readonly moneyStoragesProvider: MoneyStoragesProvider,
  ) { }

  public async getCurrenciesList(params: { pagination: Pagination }): Promise<[CurrencyEntity[], number]> {
    await this.moneyStoragesProvider.findAndCount(params);
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
      throw new BadRequestException('Currencies with this code already exist');
    }

    this.currenciesProvider.create({
      ...data,
      status: CurrencyStatus.ACTIVE,
    });
    return this.getCurrenciesList({ pagination });
  }
}