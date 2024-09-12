import { ApiProperty } from '@nestjs/swagger';

export class UpdateHistoryDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  readonly message: string;
}
