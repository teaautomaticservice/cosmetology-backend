import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import {
  TokensCreatedUsersProviderModule
} from '@providers/tokensCreatedUsers/tokensCreatedUsersProvider.module';
import { UsersProviderModule } from '@providers/users/usersProvider.module';

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
