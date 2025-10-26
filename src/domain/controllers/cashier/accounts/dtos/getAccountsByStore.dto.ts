import { ApiProperty } from '@nestjs/swagger';
import { AccountsByStoreDto } from '@providers/cashier/accounts/dtos/accountByStore.dto';

import { GetAccountDto } from './getAccount.dto';
import { MoneyStorageDto } from '../../moneyStorages/dtos/moneyStorage.dto';

export class GetAccountsByStoreDto extends MoneyStorageDto {
  @ApiProperty({
    isArray: true,
    type: GetAccountDto,
    required: true,
  })
  public accounts: GetAccountDto[];

  constructor(accountByStore: AccountsByStoreDto) {
    super(accountByStore);

    this.accounts = accountByStore.accounts.map((account) => new GetAccountDto(account));
  }
}
