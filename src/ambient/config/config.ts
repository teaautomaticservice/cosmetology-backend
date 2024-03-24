import { Configuration } from './config.types';
import { getDatabaseConfig } from './database/database';

const ENV_PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const IS_PRODUCTION = NODE_ENV === 'production';

export const getConfig = (): Configuration => ({
  isProduction: IS_PRODUCTION,
  port: parseInt(ENV_PORT, 10) || 3000,
  database: getDatabaseConfig(),
});
