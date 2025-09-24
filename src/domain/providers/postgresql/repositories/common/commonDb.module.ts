import { AsyncContextProviderModule } from '@ambientProviders/asyncContext/asyncContextProvider.module';
import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [LoggerProviderModule, AsyncContextProviderModule],
  exports: [LoggerProviderModule, AsyncContextProviderModule],
})
export class CommonDbModule {}
