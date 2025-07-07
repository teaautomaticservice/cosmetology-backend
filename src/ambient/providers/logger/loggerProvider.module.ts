import { AsyncContextProviderModule } from '@ambientProviders/asyncContext/asyncContextProvider.module';
import { Module } from '@nestjs/common';

import { LoggerProvider } from './logger.provider';

@Module({
  imports: [AsyncContextProviderModule],
  providers: [LoggerProvider],
  exports: [LoggerProvider],
})
export class LoggerProviderModule {}
