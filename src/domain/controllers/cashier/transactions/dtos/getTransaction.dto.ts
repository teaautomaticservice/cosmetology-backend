import { GetAccountDto } from '@controllers/cashier/accounts/dtos/getAccount.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionEntity } from '@postgresql/repositories/cashier/transactions/transactions.entity';
import { OperationType, TransactionStatus } from '@postgresql/repositories/cashier/transactions/transactions.types';
import { ID } from '@providers/common/common.type';
import { getNumberFromString } from '@utils/formattiers';

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
    nullable: true,
  })
  public readonly parentTransactionId: string | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public transactionId: string;

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
    type: GetAccountDto,
    required: true,
    nullable: true,
  })
  public readonly debitAccount: GetAccountDto | null;

  @ApiProperty({
    type: 'number',
    required: true,
    nullable: true,
  })
  public readonly creditId: ID | null;

  @ApiProperty({
    type: GetAccountDto,
    required: true,
    nullable: true,
  })
  public readonly creditAccount: GetAccountDto | null;

  @ApiProperty({
    enum: TransactionStatus,
    required: true,
    nullable: false,
  })
  public status: TransactionStatus;

  @ApiProperty({
    enum: OperationType,
    required: true,
    nullable: false,
  })
  public operationType: OperationType;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: true,
  })
  public readonly executionDate: Date | null;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: true,
  })
  public readonly expireDate: Date | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public description: string | null;

  constructor({
    id,
    transactionId,
    parentTransactionId,
    amount,
    debitId,
    debitAccount,
    creditId,
    creditAccount,
    status,
    operationType,
    expireDate,
    executionDate,
    description,
  }: TransactionEntity) {
    Object.assign<GetTransactionDto, GetTransactionDto>(this, {
      id,
      transactionId,
      parentTransactionId,
      amount: getNumberFromString(amount),
      debitId,
      debitAccount: debitAccount ? new GetAccountDto(debitAccount) : null,
      creditId,
      creditAccount: creditAccount ? new GetAccountDto(creditAccount) : null,
      status,
      operationType,
      expireDate,
      executionDate,
      description,
    });
  }
}