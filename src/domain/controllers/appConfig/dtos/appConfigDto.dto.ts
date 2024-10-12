import { CurrentUserDto } from '@domain/controllers/common/dtos/currentUser.dto';
import { UserEntity } from '@domain/providers/postgresql/repositories/users/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AppConfigDto {
  @ApiProperty({
    type: () => CurrentUserDto,
    required: true,
    nullable: true,
  })
  public currentUser: CurrentUserDto | null;

  constructor({
    currentUser,
  }: {
    currentUser: UserEntity | null;
  }) {
    this.currentUser = currentUser ? new CurrentUserDto(currentUser) : null;
  }
}