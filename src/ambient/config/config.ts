import { Configuration } from './config.types';
import { getDatabaseConfig } from './database/database';

const ENV_PORT = process.env.PORT;
const INSTANCE_ID = process.env.INSTANCE_ID;
const IS_PRODUCTION = INSTANCE_ID === 'production';

export const getConfig = (): Configuration => ({
  isProduction: IS_PRODUCTION,
  port: parseInt(ENV_PORT, 10) || 3000,
  database: getDatabaseConfig(),
});
