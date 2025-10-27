import { CurrentUserDto } from '@controllers/common/dtos/currentUser.dto';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '@providers/postgresql/repositories/users/user.entity';

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