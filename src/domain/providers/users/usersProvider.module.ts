import { Module } from '@nestjs/common';

import { UsersProviders } from './users.provider';
import { UsersRepositoryModule } from '../postgresql/repositories/users/usersRepository.module';

@Module({
  imports: [UsersRepositoryModule],
  providers: [UsersProviders],
  exports: [UsersProviders],
})
export class UsersProviderModule {}
