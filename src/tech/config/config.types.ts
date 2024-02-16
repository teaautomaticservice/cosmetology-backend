import { DatabaseConfig } from './database/database.types';

export interface Configuration {
  port: number;
  database: DatabaseConfig;
}
