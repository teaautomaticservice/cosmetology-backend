import { HistoryWithUsersDto } from '@domain/providers/histories/dto/historyWithUsers.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';

export class HistoryDto {
  @ApiProperty({
    type: 'number',
    required: true,
    nullable: false,
  })
  public readonly id: ID;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  public readonly date: Date;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly owner: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly updatedBy: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly message: string;

  constructor({ id, date, message, createdByUser, updatedByUser }: HistoryWithUsersDto) {
    this.id = id;
    this.date = date;
    this.owner = createdByUser ? UserEntity.getDisplayName(createdByUser) : 'N/A';
    this.updatedBy = updatedByUser ? UserEntity.getDisplayName(updatedByUser) : 'N/A';
    this.message = message;
  }
}
