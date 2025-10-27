import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';
import { UserServiceModule } from '@services/user/userService.module';

import { UsersController } from './users.controller';

@Module({
  imports: [AuthorizationServiceModule, UserServiceModule],
  controllers: [UsersController],
})
export class UsersControllerModule {}
