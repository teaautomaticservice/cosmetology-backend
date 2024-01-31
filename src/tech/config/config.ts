import { Configuration } from './config.types';
import { getDatabaseConfig } from './database/database';

export const getConfig = (): Configuration => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: getDatabaseConfig(),
});
