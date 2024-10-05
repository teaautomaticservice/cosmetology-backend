import { config as dotenvConfig } from 'dotenv';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { registerAs } from '@nestjs/config';

import { IS_PRODUCTION } from '../../constants/env';

dotenvConfig({ path: '.env' });

const migrations = IS_PRODUCTION ?
  ['src/migrations/prod/*.js', 'src/migrations/prod/*.ts'] :
  [
    'src/migrations/prod/*.js',
    'src/migrations/prod/*.ts',
    'src/migrations/dev/*.js',
    'src/migrations/dev/*.ts'
  ];

export const getDatabaseConfig = (): PostgresConnectionOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST ?? '',
  port: Number(process.env.DB_PORT),
  username: process.env.POSTGRES_USER ?? '',
  password: process.env.POSTGRES_PASSWORD ?? '',
  database: process.env.DB_NAME ?? '',
  autoLoadEntities: true,
  migrations,
  migrationsTableName: 'migrations',
  synchronize: false,
} as PostgresConnectionOptions);

export default registerAs('typeorm', () => getDatabaseConfig());
export const connectionSource = new DataSource(getDatabaseConfig());
