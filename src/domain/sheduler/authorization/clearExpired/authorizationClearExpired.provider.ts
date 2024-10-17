import { Logger } from 'winston';

import { Resources } from '@constants/resources';
import { AuthorizationService } from '@domain/services/authorization/authorization.service';
import { Provider } from '@nestjs/common';

import { AuthorizationClearExpiredSheduler } from './authorizationClearExpired.sheduler';

export const authorizationClearExpiredShedulerProvider: Provider<AuthorizationClearExpiredSheduler> = {
  provide: Resources.AuthorizationClearExpiredSheduler,
  inject: [Resources.LOGGER, AuthorizationService],
  useFactory: (logger: Logger, authorizationService: AuthorizationService) =>
    new AuthorizationClearExpiredSheduler(logger, authorizationService),
};
