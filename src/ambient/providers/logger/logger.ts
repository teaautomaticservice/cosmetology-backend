import * as winston from 'winston';

import { AppConfigService, Configuration } from '@config/config.types';
import { LoggerTypes } from '@constants/loggerTypes';
import { Resources } from '@constants/resources';
import { PostgresTransport } from '@innova2/winston-pg';
import { ConfigService } from '@nestjs/config';
import { LogEntity } from '@providers/postgresql/repositories/logs/log.entity';

import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const LoggerProvider = {
  provide: Resources.LOGGER,
  inject: [ConfigService],
  useFactory: (configService: AppConfigService): winston.Logger => {
    const isProduction = configService.get<boolean>('isProduction');
    const db = configService.get<Configuration['database']>('database');

    const generalLoggingLevel = isProduction ? LoggerTypes.info : LoggerTypes.debug;

    const metaFormat = winston.format((info) => {
      const newInfo: winston.Logform.TransformableInfo & { meta: unknown } = {
        ...info,
        meta: info.metadata,
      };
      delete newInfo.metadata;
      return newInfo;
    })();

    const consoleTransport = new winston.transports.Console({
      level: generalLoggingLevel,
      format: winston.format.combine(
        nestWinstonModuleUtilities.format.nestLike('CosmetologyApp', {
          colors: true,
          prettyPrint: true,
        })
      ),
    });

    const connectionDbString = `postgresql://${db?.user}:${db?.password}@${db?.host}:${db?.port}/${db?.name}`;

    const dbTransport = new PostgresTransport<LogEntity>({
      connectionString: connectionDbString,
      maxPool: 10,
      level: 'info',
      tableName: 'log_entity',
      tableColumns: [
        {
          name: 'id',
          dataType: 'SERIAL',
          primaryKey: true,
          unique: true,
        },
        {
          name: 'timestamp',
          dataType: 'TIMESTAMP',
        },
        {
          name: 'key',
          dataType: 'VARCHAR',
        },
        {
          name: 'level',
          dataType: 'VARCHAR',
        },
        {
          name: 'authorizedUserId',
          dataType: 'VARCHAR',
        },
        {
          name: 'message',
          dataType: 'VARCHAR',
        },
        {
          name: 'meta',
          dataType: 'JSON',
        },
      ],
    });

    const logger = winston.createLogger({
      level: generalLoggingLevel,
      format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.metadata(),
        metaFormat,
        winston.format.timestamp(),
        winston.format.ms()
      ),
      transports: [consoleTransport, dbTransport],
    });
    return logger;
  },
};
