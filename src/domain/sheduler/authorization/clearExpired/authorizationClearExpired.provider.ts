import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { Provider } from '@nestjs/common';
import { AuthorizationService } from '@services/authorization/authorization.service';

import { AuthorizationClearExpiredSheduler } from './authorizationClearExpired.sheduler';

export const authorizationClearExpiredShedulerProvider: Provider<AuthorizationClearExpiredSheduler> = {
  provide: Resources.AuthorizationClearExpiredSheduler,
  inject: [Resources.LOGGER, AuthorizationService],
  useFactory: (logger: Logger, authorizationService: AuthorizationService) =>
    new AuthorizationClearExpiredSheduler(logger, authorizationService),
};
