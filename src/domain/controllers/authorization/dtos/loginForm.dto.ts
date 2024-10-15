import { ApiProperty } from '@nestjs/swagger';

export class LoginFormDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly email: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly password: string;

  @ApiProperty({
    type: 'boolean',
    required: true,
    nullable: false,
  })
  public readonly isRemember: boolean;
}