import * as winston from 'winston';

import { AppConfigService, Configuration } from '@config/config.types';
import { LoggerTypes } from '@constants/loggerTypes';
import { Resources } from '@constants/resources';
import { LOGS_ENTITY } from '@domain/providers/postgresql/constants/entities';
import { PostgresTransport } from '@innova2/winston-pg';
import { ConfigService } from '@nestjs/config';
import { LogEntity } from '@providers/postgresql/repositories/logs/log.entity';
import { AsyncContext } from '@utils/asyncContext';

import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const LoggerProvider = {
  provide: Resources.LOGGER,
  inject: [
    ConfigService,
    Resources.AsyncContext,
  ],
  useFactory: (
    configService: AppConfigService,
    asyncContext: AsyncContext,
  ): winston.Logger => {
    const isProduction = configService.get<boolean>('isProduction');
    const db = configService.get<Configuration['database']>('database');

    const generalLoggingLevel = isProduction ? LoggerTypes.info : LoggerTypes.debug;

    const traceIdFormat = winston.format((info) => {
      const newInfo: winston.Logform.TransformableInfo & { key: string | undefined } = {
        ...info,
        key: asyncContext.getTraceIdIfRegistered(),
      };
      return newInfo;
    })();

    const authorizedUserIdFormat = winston.format((info) => {
      const authUser = asyncContext.getUserIfRegistered();
      const newInfo: winston.Logform.TransformableInfo & { authorizedUserId: number | undefined } = {
        ...info,
        authorizedUserId: authUser?.id,
      };
      return newInfo;
    })();

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
        }),
      ),
    });

    const connectionDbString = `postgresql://${db?.username}:${db?.password}@${db?.host}:${db?.port}/${db?.database}`;

    const dbTransport = new PostgresTransport<LogEntity>({
      connectionString: connectionDbString,
      maxPool: 10,
      level: 'info',
      tableName: LOGS_ENTITY,
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
        winston.format.timestamp(),
        winston.format.ms(),
        metaFormat,
        authorizedUserIdFormat,
        traceIdFormat,
      ),
      transports: [consoleTransport, dbTransport],
    });
    return logger;
  },
};
