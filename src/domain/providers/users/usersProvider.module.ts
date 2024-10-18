import { Module } from '@nestjs/common';

import { UsersProvider } from './users.provider';
import { UsersRepositoryModule } from '../postgresql/repositories/users/usersRepository.module';

@Module({
  imports: [UsersRepositoryModule],
  providers: [UsersProvider],
  exports: [UsersProvider],
})
export class UsersProviderModule {}
