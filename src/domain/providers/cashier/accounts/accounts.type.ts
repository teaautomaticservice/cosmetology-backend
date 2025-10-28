import { AccountsEntity } from '@postgresql/repositories/cashier/accounts/accounts.entity';
import { ID } from '@providers/common/common.type';

export type SortAccountsByStorages = 'status' | 'name';

export type AccountsWithStorageFilter = {
  status?: AccountsEntity['status'][];
  currenciesIds?: ID[];
  moneyStoragesIds?: ID[];
}