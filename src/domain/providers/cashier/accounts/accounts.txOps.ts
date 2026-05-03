import { createdMapFromEntity } from 'src/migrations/utils/createdMapFromEntity';

import { BadRequestException } from '@nestjs/common';
import { CommonTxOps } from '@providers/common/common.txOps';
import { ID, RecordEntity, TxOpsDeps } from '@providers/common/common.type';
import { AccountEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';

export class AccountsTxOps extends CommonTxOps<AccountEntity> {
  constructor(deps: TxOpsDeps) {
    super(deps, AccountEntity, 'account');
  }

  public async findManyForUpdate(
    ids: Array<ID | null | undefined>,
  ): Promise<Record<ID, AccountEntity | undefined>> {
    const cleanIds = ids.filter((id): id is ID => id != null);

    if (!cleanIds.length) {
      return {};
    }
    const accounts = await super.findByIds(cleanIds, { forUpdate: true });
    return createdMapFromEntity(accounts);
  }

  public async increaseBalance(account: AccountEntity, amount: bigint): Promise<void> {
    const newAvailable = (BigInt(account.available) + amount).toString();
    const newBalance = (BigInt(account.balance) + amount).toString();

    await super.updateById(account.id, {
      available: newAvailable,
      balance: newBalance,
    } as Partial<RecordEntity<AccountEntity>>);
  }

  public async decreaseBalance(
    account: AccountEntity,
    amount: bigint,
    options: {
      allowNegative?: boolean;
    } = {},
  ): Promise<void> {
    const available = BigInt(account.available);

    if (!options.allowNegative && available < amount) {
      throw new BadRequestException(
        `Insufficient funds. Available: ${account.available}, Required: ${amount}`,
      );
    }

    const newAvailable = (available - amount).toString();
    const newBalance = (BigInt(account.balance) - amount).toString();

    await super.updateById(account.id, {
      available: newAvailable,
      balance: newBalance,
    } as Partial<RecordEntity<AccountEntity>>);
  }
}