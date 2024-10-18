import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { UserStatus, UserType } from '@domain/types/users.types';
import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserDto {
  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public email: string;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public displayName: string;

  @ApiProperty({
    type: 'enum',
    enum: UserStatus,
    required: true,
    nullable: false,
  })
  public status: UserStatus;

  @ApiProperty({
    type: 'enum',
    enum: UserType,
    required: true,
    nullable: false,
  })
  public type: UserType;

  constructor(user: UserEntity) {
    this.email = user.email;
    this.displayName = UserEntity.getDisplayName(user);
    this.status = user.status;
    this.type = user.type;
  }
}