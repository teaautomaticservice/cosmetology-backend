import { CurrencyStatus } from '@domain/providers/postgresql/repositories/cashier/currencies/currencies.types';
import {
  MoneyStoragesEntity
} from '@domain/providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus
} from '@domain/providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class MoneyStorageDto {
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
  public readonly status: MoneyStorageStatus;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly code: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public readonly description: string | null;

  constructor({ id, name, status, code, description }: MoneyStoragesEntity) {
    this.id = id;
    this.name = name;
    this.status = status;
    this.code = code;
    this.description = description;
  }
}
