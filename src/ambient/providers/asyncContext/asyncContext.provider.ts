import { Resources } from '@constants/resources';
import { Provider } from '@nestjs/common';
import { AsyncContext } from '@utils/asyncContext';

import { AsyncLocalStorage } from 'async_hooks';

export const AsyncContextProvider: Provider<AsyncContext> = {
  provide: Resources.AsyncContext,
  useValue: new AsyncContext(new AsyncLocalStorage()),
};

