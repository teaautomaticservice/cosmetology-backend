import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import { AccountsEntity } from '@providers/postgresql/repositories/cashier/accounts/accounts.entity';
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

  constructor({
    id,
    name,
    moneyStorageId,
    status,
    currencyId,
    balance,
    available,
    description,
  }: AccountsEntity) {
    Object.assign(this, {
      id,
      name,
      moneyStorageId,
      status,
      currencyId,
      balance,
      available,
      description,
    });
  }
}