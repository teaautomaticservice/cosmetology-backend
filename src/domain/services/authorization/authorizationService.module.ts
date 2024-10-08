import { ExtractUserGuard } from '@domain/controllers/common/guards/extractUser.guard';
import { SessionsProviderModule } from '@domain/providers/sessions/sessionsProvider.module';
import { UsersProviderModule } from '@domain/providers/users/usersProvider.module';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuthorizationService } from './authorization.service';

@Module({
  imports: [UsersProviderModule, SessionsProviderModule],
  providers: [
    AuthorizationService,
    {
      provide: APP_GUARD,
      useClass: ExtractUserGuard,
    },
  ],
  exports: [AuthorizationService],
})
export class AuthorizationServiceModule {}
