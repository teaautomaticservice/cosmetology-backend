import { ApiProperty } from '@nestjs/swagger';
import { AccountStatus } from '@postgresql/repositories/cashier/accounts/accounts.types';
import { ID } from '@providers/common/common.type';

import { IsArray, IsInt } from 'class-validator';

export class UpdateAccountListDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
    isArray: true,
  })
  @IsArray()
  @IsInt({ each: true })
  public readonly ids: ID[];

  @ApiProperty({
    enum: AccountStatus,
    required: false,
    nullable: false,
  })
  public readonly status?: AccountStatus;
}