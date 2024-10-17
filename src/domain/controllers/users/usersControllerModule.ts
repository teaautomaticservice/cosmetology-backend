import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';

@Module({
  imports: [AuthorizationServiceModule],
  controllers: [UsersController],
})
export class UsersControllerModule {}
