import { CurrencyDto } from '@controllers/cashier/currencies/dtos/currency.dto';
import { MoneyStorageDto } from '@controllers/cashier/moneyStorages/dtos/moneyStorage.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { ID } from '@providers/common/common.type';

export class GetAccountAggregatedWithStorage {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
    isArray: true,
  })
  public ids: ID[];

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public name: string;

  @ApiProperty({
    enum: AccountStatus,
    required: true,
    nullable: false,
  })
  public status: AccountStatus;

  @ApiProperty({
    isArray: false,
    type: () => CurrencyDto,
    required: true,
  })
  public currency: CurrencyDto;

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
    isArray: true,
    type: MoneyStorageDto,
    required: true,
  })
  public moneyStorages: MoneyStorageDto[];
}