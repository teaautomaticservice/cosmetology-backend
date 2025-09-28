import { CurrenciesProvider } from '@domain/providers/cashier/currencies/currencies.provider';
import { Pagination } from '@domain/providers/common/common.type';
import { CurrencyEntity } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CashierService {
  constructor(
    private readonly currenciesProvider: CurrenciesProvider,
  ) {}

  public async getCurrenciesList(params: { pagination: Pagination }): Promise<[CurrencyEntity[], number]> {
    return this.currenciesProvider.findAndCount(params);
  }
}