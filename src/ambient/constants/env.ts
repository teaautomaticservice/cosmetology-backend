import { config as dotenvConfig } from 'dotenv';

if (process.env.CLIENT_ORIGIN == null) {
  dotenvConfig({ path: '.env' });
}

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
export const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN;
export const ENV_PORT = process.env.PORT;
export const APP_NAME = process.env.APP_NAME ?? 'App';

