import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { Configuration } from './ambient/config/config.types';
import { DEFAULT_PORT } from './ambient/constants/app';
import { Resources } from './ambient/constants/resources';
import { useSwagger } from './ambient/swagger/swagger';
import { AppModule } from './app.module';

import { WinstonLogger } from 'nest-winston';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(Resources.LOGGER);
  const config = app.get<ConfigService<Configuration>>(ConfigService);

  const port = config.get<Configuration['port']>('port') ?? DEFAULT_PORT;
  const isProduction =
    config.get<Configuration['isProduction']>('isProduction');

  app.useLogger(new WinstonLogger(logger));
  app.enableCors();

  useSwagger(app);

  await app.listen(port, () => {
    logger.debug('===================');
    logger.info(`Listening on ${port}, mode: ${isProduction ? 'prod' : 'dev'}`);
    logger.debug('===================');
  });
}
bootstrap();
