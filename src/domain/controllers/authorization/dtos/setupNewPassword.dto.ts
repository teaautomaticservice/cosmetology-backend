import { ApiProperty } from '@nestjs/swagger';

import {
  IsNotEmpty,
  Length,
} from 'class-validator';

export class SetupNewPasswordDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  @IsNotEmpty()
  @Length(6, 30)
  public readonly password: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  @IsNotEmpty()
  @Length(6, 30)
  public readonly repeatPassword: string;
}