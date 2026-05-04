import { MoneyStorageType } from '@postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { CommonTxOps } from '@providers/common/common.txOps';
import { ID, TxOpsDeps } from '@providers/common/common.type';
import { MoneyStoragesEntity } from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';

export class MoneyStoragesTxOps extends CommonTxOps<MoneyStoragesEntity> {
  constructor(deps: TxOpsDeps) {
    super(deps, MoneyStoragesEntity, 'moneyStorage');
  }

  public async findObligationByIdForUpdate(id: ID): Promise<MoneyStoragesEntity | null> {
    return super.findOne({
      where: {
        id,
        type: MoneyStorageType.OBLIGATION,
      },
    });
  }
}