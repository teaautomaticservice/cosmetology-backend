import { UsersProviderModule } from '@domain/providers/users/usersProvider.module';
import { Module } from '@nestjs/common';

import { UserService } from './user.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [UsersProviderModule, MailerModule],
  providers: [
    UserService,
  ],
  exports: [UserService],
})
export class UserServiceModule {}
