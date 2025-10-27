import { ExtractUserGuard } from '@controllers/common/guards/extractUser.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionsProviderModule } from '@providers/sessions/sessionsProvider.module';
import {
  TokensCreatedUsersProviderModule
} from '@providers/tokensCreatedUsers/tokensCreatedUsersProvider.module';
import { UsersProviderModule } from '@providers/users/usersProvider.module';

import { AuthorizationService } from './authorization.service';

@Module({
  imports: [UsersProviderModule, SessionsProviderModule, TokensCreatedUsersProviderModule],
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
