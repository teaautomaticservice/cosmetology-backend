import { MoneyStoragesEntity } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

export type MoneyStoragesFilter = {
  status?: MoneyStoragesEntity['status'][];
}