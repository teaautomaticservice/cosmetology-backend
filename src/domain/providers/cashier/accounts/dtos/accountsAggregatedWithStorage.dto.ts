import { AccountsEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

import { AccountsAggregatedWithStorage } from '../accounts.type';

export class AccountAggregatedWithStorageDto {
  public name: AccountsEntity['name'];
  public status: AccountsEntity['status'];
  public currency: CurrencyEntity;
  public balance: AccountsEntity['balance'];
  public available: AccountsEntity['available'];
  public moneyStorages: MoneyStoragesEntity[];

  constructor({
    account,
    currency,
    moneyStorages,
  }: {
    account: AccountsAggregatedWithStorage;
    currency: CurrencyEntity;
    moneyStorages: MoneyStoragesEntity[];
  }) {
    this.name = account.name;
    this.status = account.status;
    this.currency = currency;
    this.balance = account.balance ?? 0;
    this.available = account.available ?? 0;
    this.moneyStorages = moneyStorages;
  }
}