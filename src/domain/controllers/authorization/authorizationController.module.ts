import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';

import { AuthorizationController } from './authorization.controller';

@Module({
  imports: [AuthorizationServiceModule],
  controllers: [
    AuthorizationController,
  ]
})
export class AuthorizationControllerModule {}