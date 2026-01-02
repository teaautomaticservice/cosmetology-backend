import { AccountEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { CurrencyEntity } from '@postgresql/repositories/cashier/currencies/currencies.entity';
import { MoneyStoragesEntity } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import { ID, RecordEntity } from '@providers/common/common.type';

export type SortAccountsByStorages = 'status' | 'name';

export type UpdateAccountsByIdsData = Omit<Partial<RecordEntity<AccountEntity>>, 'status'>;

export type AccountsWithStorageFilter = {
  ids?: ID[];
  name?: AccountEntity['name'];
  status?: AccountEntity['status'][];
  notStatus?: AccountEntity['status'][];
  currenciesIds?: ID[];
  moneyStoragesIds?: ID[];
  query?: string;
}

export type AccountsAggregatedWithStorage = Pick<AccountEntity, 'name' | 'status' | 'currencyId'> &
{
  ids?: ID[];
  balance?: AccountEntity['balance'];
  available?: AccountEntity['available'];
  moneyStorageIds?: (AccountEntity['moneyStorageId'] | undefined)[];
}

export type AccountsAggregatedWithStorageFilter = {
  name?: AccountEntity['name'];
  status?: AccountEntity['status'][];
  notStatus?: AccountEntity['status'][];
  currenciesIds?: ID[];
  moneyStoragesIds?: ID[];
  query?: string;
  balanceFrom?: number;
  balanceTo?: number;
}

export type EnrichedAccountData<T extends {
    moneyStorageId?: ID;
    currencyId?: ID;
  }> = T & {
    moneyStorage?: MoneyStoragesEntity;
    moneyStorages?: MoneyStoragesEntity[];
    currency?: CurrencyEntity;
  };