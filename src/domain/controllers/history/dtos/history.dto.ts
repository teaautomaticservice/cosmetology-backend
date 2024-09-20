import { ApiProperty } from '@nestjs/swagger';

import { ID } from '@providers/common/common.type';
import { MessageEntity } from '@providers/postgresql/repositories/history/message.entity';

export class HistoryDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  readonly id: ID;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  readonly date: Date;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  readonly owner: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  readonly message: string;

  constructor({ id, date, owner, message }: MessageEntity) {
    this.id = id;
    this.date = date;
    this.owner = owner;
    this.message = message;
  }
}
