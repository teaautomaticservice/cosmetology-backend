import { ConfigService } from '@nestjs/config';

import { DatabaseConfig } from './database/database.types';

export interface Configuration {
  isProduction: boolean;
  port: number;
  database: DatabaseConfig;
}

export type AppConfigService = ConfigService<Configuration>;
