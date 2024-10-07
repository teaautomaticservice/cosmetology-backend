import { Module } from '@nestjs/common';

import { SessionsRepositoryModule } from '../postgresql/repositories/sessions/sessionsRepository.module';
import { SessionsProvider } from './sessions.provider';

@Module({
  imports: [SessionsRepositoryModule],
  providers: [SessionsProvider],
  exports: [SessionsProvider],
})
export class SessionsProviderModule {}
