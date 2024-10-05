import { Module } from '@nestjs/common';
import { UsersRepositoryModule } from '@providers/postgresql/repositories/users/usersRepository.module';

import { AuthorizationService } from './authorization.service';

@Module({
  imports: [UsersRepositoryModule],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationServiceModule {}
