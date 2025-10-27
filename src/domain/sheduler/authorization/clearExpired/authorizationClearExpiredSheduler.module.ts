import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';

import { authorizationClearExpiredShedulerProvider } from './authorizationClearExpired.provider';

@Module({
  imports: [AuthorizationServiceModule, LoggerProviderModule],
  providers: [authorizationClearExpiredShedulerProvider],
})
export class AuthorizationClearExpiredShedulerModule {}
