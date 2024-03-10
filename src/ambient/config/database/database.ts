import { DatabaseConfig } from './database.types';

export const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  name: process.env.DB_NAME,
});
