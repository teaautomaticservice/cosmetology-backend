import { SessionsProviderModule } from '@domain/providers/sessions/sessionsProvider.module';
import { UsersProviderModule } from '@domain/providers/users/usersProvider.module';
import { Module } from '@nestjs/common';

import { AuthorizationService } from './authorization.service';

@Module({
  imports: [UsersProviderModule, SessionsProviderModule],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationServiceModule {}
