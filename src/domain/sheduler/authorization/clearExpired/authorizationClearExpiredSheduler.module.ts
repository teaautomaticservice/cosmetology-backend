import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { AuthorizationServiceModule } from '@domain/services/authorization/authorizationService.module';
import { Module } from '@nestjs/common';

import { authorizationClearExpiredShedulerProvider } from './authorizationClearExpired.provider';

@Module({
  imports: [AuthorizationServiceModule, LoggerProviderModule],
  providers: [authorizationClearExpiredShedulerProvider],
})
export class AuthorizationClearExpiredShedulerModule {}
