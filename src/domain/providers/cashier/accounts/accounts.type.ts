import { AccountsEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
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