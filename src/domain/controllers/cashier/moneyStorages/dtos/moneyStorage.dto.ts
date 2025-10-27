import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import {
  MoneyStoragesEntity
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.entity';
import {
  MoneyStorageStatus
} from '@providers/postgresql/repositories/cashier/moneyStorages/moneyStorages.types';

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
    enum: MoneyStorageStatus,
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
    Object.assign(this, {
      id,
      name,
      status,
      code,
      description,
    });
  }
}
