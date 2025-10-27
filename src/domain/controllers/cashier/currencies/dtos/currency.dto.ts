import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import { CurrencyEntity } from '@providers/postgresql/repositories/cashier/currencies/currencies.entity';
import { CurrencyStatus } from '@providers/postgresql/repositories/cashier/currencies/currencies.types';

export class CurrencyDto {
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
  public readonly name: string;

  @ApiProperty({
    enum: CurrencyStatus,
    required: true,
    nullable: false,
  })
  public readonly status: CurrencyStatus;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly code: string;

  constructor({ id, name, status, code }: CurrencyEntity) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.code = code;
  }
}
