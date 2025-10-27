import { AccountsEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

export class AccountWithMoneyStorageDto extends AccountsEntity {
  public moneyStorage: MoneyStoragesEntity | null;

  constructor({
    account,
    moneyStorage,
  }: {
    account: AccountsEntity;
    moneyStorage: MoneyStoragesEntity | null;
  }) {
    super();

    Object.assign(this, {
      ...account,
      moneyStorage,
    });
  }
}