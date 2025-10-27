import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '@typings/users.types';

export class CreateUserDto {
  @ApiProperty({
    type: 'string',
    format: 'email',
    required: true,
    nullable: false,
  })
  public readonly email: string;

  @ApiProperty({
    enum: UserType,
    required: true,
    nullable: false,
  })
  public readonly type: UserType;

  @ApiProperty({
    type: 'string',
    required: false,
    nullable: true,
  })
  public readonly displayName?: string | null;
}