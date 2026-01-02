import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class NewTransactionDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public amount: number;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: true,
  })
  public readonly debitId: ID | null;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: true,
  })
  public readonly creditId: ID | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;
}