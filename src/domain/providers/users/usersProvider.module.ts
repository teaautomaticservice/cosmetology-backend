import { MailerModule } from '@domain/services/mailer/mailer.module';
import { Module } from '@nestjs/common';

import { UsersProvider } from './users.provider';
import { UsersRepositoryModule } from '../postgresql/repositories/users/usersRepository.module';

@Module({
  imports: [UsersRepositoryModule, MailerModule],
  providers: [UsersProvider],
  exports: [UsersProvider],
})
export class UsersProviderModule {}
