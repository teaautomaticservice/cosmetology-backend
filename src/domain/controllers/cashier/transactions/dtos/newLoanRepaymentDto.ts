import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';

export class NewLoanRepaymentDto {
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
  public readonly creditObligationAccountId: ID;

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
    type: 'string',
    required: true,
    nullable: true,
  })
  public readonly description: string | null;
}