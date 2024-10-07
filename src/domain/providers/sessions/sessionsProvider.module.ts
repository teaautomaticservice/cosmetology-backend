import { Module } from '@nestjs/common';

import { SessionsProvider } from './sessions.provider';
import { SessionsRepositoryModule } from '../postgresql/repositories/sessions/sessionsRepository.module';

@Module({
  imports: [SessionsRepositoryModule],
  providers: [SessionsProvider],
  exports: [SessionsProvider],
})
export class SessionsProviderModule {}
