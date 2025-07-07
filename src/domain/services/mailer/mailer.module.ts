import { LoggerProviderModule } from '@ambientProviders/logger/loggerProvider.module';
import { Module } from '@nestjs/common';

import { Mailer } from './mailer.service';

@Module({
  imports: [LoggerProviderModule],
  providers: [Mailer],
  exports: [Mailer]
})
export class MailerModule {}