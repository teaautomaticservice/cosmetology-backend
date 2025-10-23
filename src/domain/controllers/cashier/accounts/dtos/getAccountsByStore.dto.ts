import { ApiProperty } from '@nestjs/swagger';
import { AccountsByStoreDto } from '@providers/cashier/accounts/dtos/accountByStore.dto';

import { AccountDto } from './account.dto';
import { MoneyStorageDto } from '../../moneyStorages/dtos/moneyStorage.dto';

export class GetAccountsByStoreDto extends MoneyStorageDto {
  @ApiProperty({
    isArray: true,
    type: AccountDto,
    required: true,
  })
  public accounts: AccountDto[];

  constructor(accountByStore: AccountsByStoreDto) {
    super(accountByStore);

    this.accounts = accountByStore.accounts.map((account) => new AccountDto(account));
  }
}