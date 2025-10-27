import { Logger } from 'winston';

import { Resources } from '@commonConstants/resources';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthorizationService } from '@services/authorization/authorization.service';

const DAEMON_NAME = 'daemonAuthorizationClearExpired';

@Injectable()
export class AuthorizationClearExpiredSheduler {
  constructor(
    @Inject(Resources.LOGGER) private readonly logger: Logger,
    private readonly authorizationService: AuthorizationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: DAEMON_NAME,
  })
  public async clearExpiredSession(): Promise<void> {
    this.authorizationService.clearExpiredSessions();
  }
}