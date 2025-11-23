import { AccountsEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import { ID } from '@providers/common/common.type';

export type SortAccountsByStorages = 'status' | 'name';

export type AccountsWithStorageFilter = {
  ids?: ID[];
  status?: AccountsEntity['status'][];
  notStatus?: AccountsEntity['status'][];
  currenciesIds?: ID[];
  moneyStoragesIds?: ID[];
}

export type AccountsAggregatedWithStorage = Pick<AccountsEntity, 'name' | 'status' | 'currencyId'> &
{
  balance?: AccountsEntity['balance'];
  available?: AccountsEntity['available'];
  moneyStorageIds?: (AccountsEntity['moneyStorageId'] | undefined)[];
}

export type EnrichedAccountData<T extends {
    moneyStorageId?: ID;
    currencyId?: ID;
  }> = T & {
    moneyStorage?: MoneyStoragesEntity;
    moneyStorages?: MoneyStoragesEntity[];
    currency?: CurrencyEntity;
  };