import { InternalServerErrorException } from '@nestjs/common';
import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import { ID } from '@providers/common/common.type';

import { AccountsAggregatedWithStorage } from '../accounts.type';

export class AccountAggregatedWithStorageDto {
  public ids: ID[];
  public name: AccountEntity['name'];
  public status: AccountEntity['status'];
  public currency: CurrencyEntity;
  public balance: AccountEntity['balance'];
  public available: AccountEntity['available'];
  public moneyStorages: MoneyStoragesEntity[];

  constructor({
    account,
    currency,
    moneyStorages,
  }: {
    account: AccountsAggregatedWithStorage;
    currency?: CurrencyEntity;
    moneyStorages?: MoneyStoragesEntity[];
  }) {
    if (!currency || !moneyStorages || !account.ids) {
      throw new InternalServerErrorException('AccountsAggregatedWithStorage error aggregation');
    }

    this.ids = account.ids;
    this.name = account.name;
    this.status = account.status;
    this.currency = currency;
    this.balance = account.balance ?? '0';
    this.available = account.available ?? '0';
    this.moneyStorages = moneyStorages;
  }
}