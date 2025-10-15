import { ApiProperty } from '@nestjs/swagger';

export class CreateMoneyStorageDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly name: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly code: string;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  public readonly description?: string | null;
}
