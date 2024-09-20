import { ApiProperty } from '@nestjs/swagger';

export class LogsDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  id: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  timestamp: Date;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  key: string | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  level: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  authorizedUserId: string | null;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  message: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: true,
  })
  meta: string | null;
}
