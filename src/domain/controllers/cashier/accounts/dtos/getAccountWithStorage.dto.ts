import { CurrencyDto } from '@controllers/cashier/currencies/dtos/currency.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { AccountWithMoneyStorageDto } from '@providers/cashier/accounts/dtos/accountWithMoneyStorage.dto';
import { ID } from '@providers/common/common.type';

import { MoneyStorageDto } from '../../moneyStorages/dtos/moneyStorage.dto';

export class GetAccountWithStorageDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public id: ID;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public name: string;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  public createdAt: Date;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  public updatedAt: Date;

  @ApiProperty({
    enum: AccountStatus,
    required: true,
    nullable: false,
  })
  public status: AccountStatus;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public balance: number;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public available: number;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public moneyStorageId: ID;

  @ApiProperty({
    type: () => MoneyStorageDto,
    required: true,
    nullable: true,
  })
  public moneyStorage: MoneyStorageDto | null;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public currencyId: ID;

  @ApiProperty({
    isArray: false,
    type: () => CurrencyDto,
    required: true,
  })
  public currency: CurrencyDto;

  constructor({
    id,
    available,
    balance,
    createdAt,
    updatedAt,
    name,
    status,
    description,
    moneyStorage,
    currencyId,
    moneyStorageId,
    currency,
  }: AccountWithMoneyStorageDto) {
    Object.assign(this, {
      id,
      available,
      balance,
      createdAt,
      updatedAt,
      name,
      status,
      description,
      moneyStorageId,
      moneyStorage,
      currencyId,
      currency,
    });
  }
}
