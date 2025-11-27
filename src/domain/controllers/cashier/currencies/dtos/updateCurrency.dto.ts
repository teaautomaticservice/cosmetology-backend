import { ApiProperty } from '@nestjs/swagger';
import { CurrencyStatus } from '@postgresql/repositories/cashier/currencies/currencies.types';
import { ID } from '@providers/common/common.type';

export class UpdateCurrencyDto {
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
  })
  public readonly name?: string;

  @ApiProperty({
    enum: CurrencyStatus,
    required: false,
    nullable: false,
  })
  public readonly status?: CurrencyStatus;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
  })
  public readonly code?: string;

  @ApiProperty({
    type: 'number',
    required: false,
    nullable: false,
  })
  public readonly currencyId?: ID;

  @ApiProperty({
    type: 'number',
    required: false,
    nullable: false,
  })
  public readonly moneyStorageId?: ID;
}