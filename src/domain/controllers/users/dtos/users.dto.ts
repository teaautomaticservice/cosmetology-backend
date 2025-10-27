import { ApiProperty } from '@nestjs/swagger';
import { ID } from '@providers/common/common.type';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';
import { UserStatus, UserType } from '@typings/users.types';

export class UsersDto {
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
  public readonly createdAt: Date;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    required: true,
    nullable: false,
  })
  public readonly updatedAt: Date;

  @ApiProperty({
    type: 'string',
    format: 'email',
    required: true,
    nullable: false,
  })
  public readonly email: string;

  @ApiProperty({
    enum: UserStatus,
    required: true,
    nullable: false,
  })
  public readonly status: UserStatus;

  @ApiProperty({
    enum: UserType,
    required: true,
    nullable: false,
  })
  public readonly type: UserType;

  @ApiProperty({
    type: 'string',
    required: true,
    nullable: false,
  })
  public readonly displayName: string;

  constructor(user: UserEntity) {
    this.id = user.id;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.email = user.email;
    this.status = user.status;
    this.type = user.type;
    this.displayName = UserEntity.getDisplayName(user);
  }
}