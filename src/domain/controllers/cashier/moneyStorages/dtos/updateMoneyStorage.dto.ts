import {
  MoneyStorageStatus
} from '@domain/providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMoneyStorageDto {
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
  })
  public readonly name?: string;

  @ApiProperty({
    enum: MoneyStorageStatus,
    required: false,
    nullable: false,
  })
  public readonly status?: MoneyStorageStatus;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
  })
  public readonly code?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
  })
  public readonly description?: string;
}
