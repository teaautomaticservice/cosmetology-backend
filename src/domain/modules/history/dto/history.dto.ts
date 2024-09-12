import { ApiProperty } from '@nestjs/swagger';

import type { ID } from '../history.typings';
import { MessageEntity } from 'src/domain/repositories/entities/message/message.entity';

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
