import { ApiProperty } from '@nestjs/swagger';

export class LogsDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public id: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  public timestamp: Date;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public key: string | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public level: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public authorizedUserId: string | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public message: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  public meta: string | null;
}
