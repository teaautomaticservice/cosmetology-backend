import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';

export interface Configuration {
  isProduction: boolean;
  port: number;
  database: PostgresConnectionOptions;
  mailer: MailerOptions;
  corsParams: {
    origin: string | undefined;
  };
}

export type AppConfigService = ConfigService<Configuration>;
