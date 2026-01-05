import { AccountEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import { MoneyStoragesEntity } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

import { EnrichedAccountData } from '../accounts.type';

export class AccountsByStoreDto extends MoneyStoragesEntity {
  public accounts: EnrichedAccountData<AccountEntity>[];

  public balance: number;

  public available: number;

  constructor({
    moneyStorage,
    accounts,
    balance,
    available,
  }: {
    moneyStorage: MoneyStoragesEntity;
    accounts: EnrichedAccountData<AccountEntity>[];
    balance: number;
    available: number;
  }) {
    super();

    Object.assign(this, {
      ...moneyStorage,
      accounts,
      balance,
      available,
    });
  }
}