import { readFileSync } from 'fs';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { Configuration } from './ambient/config/config.types';
import { DEFAULT_PORT } from './ambient/constants/app';
import { Resources } from './ambient/constants/resources';
import { exceptionFactory } from './ambient/factories/exceptionFactory';
import { AllExceptionsFilter } from './ambient/filters/allExceptionsFilter.filter';
import { useSwagger } from './ambient/swagger/swagger';
import { AppModule } from './app.module';

import * as cookieParser from 'cookie-parser';
import { WinstonLogger } from 'nest-winston';

async function bootstrap(): Promise<void> {
  const httpsOptions = {
    key: readFileSync('./https/localhost.key'),
    cert: readFileSync('./https//localhost.crt'),
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  const logger = app.get(Resources.LOGGER);
  const config = app.get<ConfigService<Configuration>>(ConfigService);

  const port = config.get<Configuration['port']>('port') ?? DEFAULT_PORT;
  const isProduction = config.get<Configuration['isProduction']>('isProduction');
  const corsParams = config.get<Configuration['corsParams']>('corsParams');

  app.useLogger(new WinstonLogger(logger));
  app.enableCors({
    origin: corsParams?.origin,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    exceptionFactory,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  if (!isProduction) {
    useSwagger(app);
  }

  await app.listen(port, () => {
    logger.debug('===================');
    logger.info(`Listening on ${port}, mode: ${isProduction ? 'prod' : 'dev'}`);
    logger.debug('===================');
  });
}
bootstrap();
