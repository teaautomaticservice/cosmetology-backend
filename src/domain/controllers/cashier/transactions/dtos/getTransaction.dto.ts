import { ApiProperty } from '@nestjs/swagger';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { ID } from '@providers/common/common.type';

export class GetTransactionDto {
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
  public transactionId: string;

  constructor({
    id,
    transactionId
  }: TransactionEntity) {
    Object.assign(this, {
      id,
      transactionId,
    });
  }
}