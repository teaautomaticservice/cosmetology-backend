import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import {
  TokensCreatedUsersProviderModule
} from '@domain/providers/tokensCreatedUsers/tokensCreatedUsersProvider.module';
import { UsersProviderModule } from '@domain/providers/users/usersProvider.module';
import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    UsersProviderModule,
    MailerModule,
    LoggerProviderModule,
    TokensCreatedUsersProviderModule,
  ],
  providers: [
    UserService,
  ],
  exports: [UserService],
})
export class UserServiceModule {}
