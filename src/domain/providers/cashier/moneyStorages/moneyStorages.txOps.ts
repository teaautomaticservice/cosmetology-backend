import { CommonTxOps } from '@providers/common/common.txOps';
import { TxOpsDeps } from '@providers/common/common.type';
import { MoneyStoragesEntity } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

export class MoneyStoragesTxOps extends CommonTxOps<MoneyStoragesEntity> {
  constructor(deps: TxOpsDeps) {
    super(deps, MoneyStoragesEntity, 'moneyStorage');
  }
}