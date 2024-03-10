import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonModuleUtilities, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import { AppConfigService } from '../config/config.types';

export const getLogger = {
  provide: 'lolkek',
  inject: [ConfigService],
  useFactory: (
    configService: AppConfigService,
  ) => {
    const isProduction = configService.get<boolean>('isProduction');

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

    const logger = winston.createLogger({
      level: generalLoggingLevel,
      transports: [
        consoleTransport,

      ],
    });
    return logger;
  }
}