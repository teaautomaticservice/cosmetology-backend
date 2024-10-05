import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { ConfigService } from '@nestjs/config';

export interface Configuration {
  isProduction: boolean;
  port: number;
  database: PostgresConnectionOptions;
}

export type AppConfigService = ConfigService<Configuration>;
