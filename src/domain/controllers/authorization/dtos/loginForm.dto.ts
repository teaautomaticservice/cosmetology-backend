import { ApiProperty } from '@nestjs/swagger';

import {
  IsEmail,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class LoginFormDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  @IsEmail()
  public readonly email: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  @IsNotEmpty()
  @Length(6, 30)
  public readonly password: string;

  @ApiProperty({
    type: 'boolean',
    required: true,
    nullable: false,
  })
  @IsNotEmpty()
  public readonly isRemember: boolean;
}