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

  @ApiProperty({
    type: 'number',
    required: true,
  })
  public balance: number;

  @ApiProperty({
    type: 'number',
    required: true,
  })
  public available: number;

  @ApiProperty({
    type: 'number',
    required: true,
  })
  public income: number;

  @ApiProperty({
    type: 'number',
    required: true,
  })
  public expend: number;

  @ApiProperty({
    type: 'number',
    required: true,
  })
  public transfer: number;

  constructor(accountByStore: AccountsByStoreDto) {
    super(accountByStore);

    this.accounts = accountByStore.accounts.map((account) => new GetAccountDto(account));
    this.balance = accountByStore.balance;
    this.available = accountByStore.available;
    this.income = accountByStore.income;
    this.expend = accountByStore.expend;
    this.transfer = accountByStore.transfer;
  }
}
