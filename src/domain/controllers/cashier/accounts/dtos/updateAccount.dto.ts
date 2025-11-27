import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';

export class UpdateAccountDto {
  @ApiProperty({
    type: 'string',
    required: false,
    nullable: false,
  })
  public readonly name?: string;

  @ApiProperty({
    enum: AccountStatus,
    required: false,
    nullable: false,
  })
  public readonly status?: AccountStatus;
}