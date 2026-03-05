import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class NewLentRepaymentDto {
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
  public readonly obligationAccountId: ID;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly debitId: ID;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public readonly description: string | null;
}