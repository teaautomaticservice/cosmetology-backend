import { LoggerProvider } from '@ambientProviders/logger/logger';
import { Module } from '@nestjs/common';

import { Mailer } from './mailer.service';

@Module({
  providers: [Mailer, LoggerProvider],
  exports: [Mailer]
})
export class MailerModule {}