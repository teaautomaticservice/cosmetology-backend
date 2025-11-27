import { CurrencyDto } from '@controllers/cashier/currencies/dtos/currency.dto';
import { MoneyStorageDto } from '@controllers/cashier/moneyStorages/dtos/moneyStorage.dto';
import { ApiProperty } from '@nestjs/swagger';
import { EnrichedAccountData } from '@providers/cashier/accounts/accounts.type';
import { ID } from '@providers/common/common.type';
import { AccountEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
import { AccountStatus } from '@providers/postgresql/repositories/cashier/accounts/accounts.types';

export class GetAccountDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly id: ID;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public name: string;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public moneyStorageId: number;

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
  public currencyId: number;

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
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;

  @ApiProperty({
    type: () => MoneyStorageDto,
    required: true,
    nullable: true,
  })
  public moneyStorage: MoneyStorageDto | null;

  constructor({
    id,
    name,
    moneyStorageId,
    status,
    currency,
    currencyId,
    balance,
    available,
    description,
    moneyStorage,
  }: EnrichedAccountData<AccountEntity>) {
    Object.assign(this, {
      id,
      name,
      moneyStorageId,
      status,
      currencyId,
      balance,
      available,
      description,
      moneyStorage: moneyStorage ? new MoneyStorageDto(moneyStorage) : null,
      currency: currency ? new CurrencyDto(currency) : null,
    });
  }
}