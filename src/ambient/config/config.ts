import { DEFAULT_PORT } from '@constants/app';
import { CLIENT_ORIGIN, ENV_PORT, IS_PRODUCTION } from '@constants/env';

import { getDatabaseConfig } from './database/database';
import { Configuration } from './config.types';

export const getConfig = (): Configuration => ({
  isProduction: IS_PRODUCTION,
  port: ENV_PORT ? parseInt(ENV_PORT, 10) : DEFAULT_PORT,
  database: getDatabaseConfig(),
  corsParams: {
    origin: CLIENT_ORIGIN,
  }, 
});
