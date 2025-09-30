import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly name: string;

  @IsString()
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly code: string;
}
