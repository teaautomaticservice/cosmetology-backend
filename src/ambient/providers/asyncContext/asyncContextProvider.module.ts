import { Module } from '@nestjs/common';

import { AsyncContextProvider } from './asyncContext.provider';

@Module({
  providers: [AsyncContextProvider],
  exports: [AsyncContextProvider],
})
export class AsyncContextProviderModule {}
