import { ApiProperty } from '@nestjs/swagger';

export class NewRefundOutDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly amount: number;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly transactionId: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public readonly description: string | null;
}
