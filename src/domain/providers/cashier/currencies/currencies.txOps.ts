import { CommonTxOps } from '@providers/common/common.txOps';
import { ID, TxOpsDeps } from '@providers/common/common.type';
import { CurrencyEntity } from '@providers/postgresql/repositories/cashier/currencies/currencies.entity';

export class CurrenciesTxOps extends CommonTxOps<CurrencyEntity> {
  constructor(deps: TxOpsDeps) {
    super(deps, CurrencyEntity, 'currency');
  }

  public async findById(id: ID): Promise<CurrencyEntity | null> {
    return super.findById(id);
  }
}