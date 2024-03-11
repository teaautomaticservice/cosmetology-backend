import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonModuleUtilities, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import { AppConfigService, Configuration } from '../config/config.types';
import { Resources } from 'src/app.constants';
import { PostgresTransport } from '@innova2/winston-pg';
import { LogEntity } from 'src/domain/repositories/entities/log/log.entity';

export const LoggerProvider = {
  provide: Resources.LOGGER,
  inject: [ConfigService],
  useFactory: (
    configService: AppConfigService,
  ) => {
    const isProduction = configService.get<boolean>('isProduction');
    const db = configService.get<Configuration['database']>('database');

    const generalLoggingLevel = isProduction ? 'debug' : 'info';

    const consoleTransport = new winston.transports.Console({
      level: generalLoggingLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('CosmetologyApp', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    });

    const connectionDbString = `postgresql://${db.user}:${db.password}@${db.host}:${db.port}/${db.name}`;

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
          dataType: 'TIMESTAMP'
        },
        {
          name: 'key',
          dataType: 'VARCHAR'
        },
        {
          name: 'level',
          dataType: 'VARCHAR'
        },
        {
          name: 'authorizedUserId',
          dataType: 'VARCHAR'
        },
        {
          name: 'message',
          dataType: 'VARCHAR'
        },
        {
          name: 'meta',
          dataType: 'JSON',
        },
      ],
    })

    const logger = winston.createLogger({
      level: generalLoggingLevel,
      transports: [
        consoleTransport,
        dbTransport,
      ],
    });
    return logger;
  }
}