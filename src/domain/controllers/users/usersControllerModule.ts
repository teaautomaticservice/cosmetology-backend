import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { UserServiceModule } from '@domain/services/user/userService.module';
import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';

@Module({
  imports: [AuthorizationServiceModule, UserServiceModule],
  controllers: [UsersController],
})
export class UsersControllerModule {}
