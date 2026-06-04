import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { Provider } from '@nestjs/common';
import { AuthorizationService } from '@services/authorization/authorization.service';

import { AuthorizationClearExpiredScheduler } from './authorizationClearExpired.scheduler';

export const authorizationClearExpiredSchedulerProvider: Provider<AuthorizationClearExpiredScheduler> = {
  provide: Resources.AuthorizationClearExpiredScheduler,
  inject: [Resources.LOGGER, AuthorizationService],
  useFactory: (logger: Logger, authorizationService: AuthorizationService) =>
    new AuthorizationClearExpiredScheduler(logger, authorizationService),
};
