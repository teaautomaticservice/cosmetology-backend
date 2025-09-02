import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';

import { TokensCreatedUsersProvider } from './tokensCreatedUsers.provider';

@Module({
  imports: [LoggerProviderModule],
  providers: [TokensCreatedUsersProvider],
  exports: [TokensCreatedUsersProvider],
})
export class TokensCreatedUsersProviderModule {}