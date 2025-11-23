import { InternalServerErrorException } from '@nestjs/common';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { AccountsEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

export class AccountWithMoneyStorageDto extends AccountsEntity {
  public moneyStorage: MoneyStoragesEntity | null;

  public currency: CurrencyEntity;

  constructor({
    account,
    moneyStorage,
    currency,
  }: {
    account: AccountsEntity;
    moneyStorage: MoneyStoragesEntity | null;
    currency;
  }) {
    if (!currency) {
      throw new InternalServerErrorException('AccountsAggregatedWithStorage error aggregation');
    }

    super();

    Object.assign(this, {
      ...account,
      moneyStorage,
      currency,
    });
  }
}