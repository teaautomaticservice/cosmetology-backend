import { DEFAULT_PORT } from '@constants/app';
import { ADMIN_ORIGIN, CLIENT_ORIGIN, ENV_PORT, IS_PRODUCTION } from '@constants/env';

import { getDatabaseConfig } from './database/database';
import { getMailerConfig } from './mailer/mailer';
import { Configuration } from './config.types';

export const getConfig = (): Configuration => ({
  isProduction: IS_PRODUCTION,
  port: ENV_PORT ? parseInt(ENV_PORT, 10) : DEFAULT_PORT,
  database: getDatabaseConfig(),
  mailer: getMailerConfig(),
  corsParams: {
    origin: [CLIENT_ORIGIN ?? '', ADMIN_ORIGIN ?? ''],
  },
});
