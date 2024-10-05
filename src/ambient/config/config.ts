import { DEFAULT_PORT } from '@constants/app';
import { IS_PRODUCTION } from '@constants/env';

import { getDatabaseConfig } from './database/database';
import { Configuration } from './config.types';

const ENV_PORT = process.env.PORT ?? DEFAULT_PORT.toString();

export const getConfig = (): Configuration => ({
  isProduction: IS_PRODUCTION,
  port: parseInt(ENV_PORT, 10) || DEFAULT_PORT,
  database: getDatabaseConfig(),
});
