import { ApiProperty } from '@nestjs/swagger';
import { CurrencyStatus } from '@postgresql/repositories/cashier/currencies/currencies.types';

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
}