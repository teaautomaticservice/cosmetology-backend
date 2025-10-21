import { AccountsEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import { MoneyStoragesEntity } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

export class AccountsByStoreDto extends MoneyStoragesEntity {
  public accounts: AccountsEntity[];

  constructor({
    moneyStorage,
    accounts,
  }: {
    moneyStorage: MoneyStoragesEntity;
    accounts: AccountsEntity[];
  }) {
    super();

    Object.assign(this, {
      ...moneyStorage,
      accounts,
    });
  }
}