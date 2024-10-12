import { Module } from '@nestjs/common';
import { AuthorizationServiceModule } from '@services/authorization/authorizationService.module';

import { AppConfigController } from './appConfig.controller';

@Module({
  imports: [AuthorizationServiceModule],
  controllers: [
    AppConfigController,
  ],
})
export class AppConfigControllerModule {}