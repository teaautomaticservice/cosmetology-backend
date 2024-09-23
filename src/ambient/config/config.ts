import { getDatabaseConfig } from './database/database';
import { Configuration } from './config.types';
import { DEFAULT_PORT } from '../constants/app';

const ENV_PORT = process.env.PORT ?? DEFAULT_PORT.toString();
const NODE_ENV = process.env.NODE_ENV;
const IS_PRODUCTION = NODE_ENV === 'production';

export const getConfig = (): Configuration => ({
  isProduction: IS_PRODUCTION,
  port: parseInt(ENV_PORT, 10) || DEFAULT_PORT,
  database: getDatabaseConfig(),
});
