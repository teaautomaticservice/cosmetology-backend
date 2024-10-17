import { LoggerProvider } from '@ambientProviders/logger/logger';
import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { Module } from '@nestjs/common';

import { authorizationClearExpiredShedulerProvider } from './authorizationClearExpired.provider';

@Module({
  imports: [AuthorizationServiceModule],
  providers: [authorizationClearExpiredShedulerProvider, LoggerProvider],
})
export class AuthorizationClearExpiredShedulerModule {}
