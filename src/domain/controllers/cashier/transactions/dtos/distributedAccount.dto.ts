import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class DistributedAccountDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly amount: number;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly debitId: ID;
}