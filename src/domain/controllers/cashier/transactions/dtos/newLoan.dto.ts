import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class NewLoanDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public amount: number;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly debitId: ID;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly creditId: ID;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly obligationStorageId: ID;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;
}