import { ApiProperty } from '@nestjs/swagger';

export class UpdateHistoryDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly message: string;
}
