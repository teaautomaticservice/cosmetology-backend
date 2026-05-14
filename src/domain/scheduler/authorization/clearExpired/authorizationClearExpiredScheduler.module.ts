import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';

import { authorizationClearExpiredSchedulerProvider } from './authorizationClearExpired.provider';

@Module({
  imports: [AuthorizationServiceModule, LoggerProviderModule],
  providers: [authorizationClearExpiredSchedulerProvider],
})
export class AuthorizationClearExpiredSchedulerModule {}
