import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class NewOpenBalanceObligationDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public amount: number;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public debitName: string;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly obligationStorageId: ID;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly currencyId: ID;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;
}