import { NestFactory } from '@nestjs/core';
import { WinstonLogger } from 'nest-winston';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { Configuration } from './ambient/config/config.types';
import { Resources } from './ambient/constants/resources';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); 
  const logger = app.get(Resources.LOGGER);
  const config = app.get<ConfigService<Configuration>>(ConfigService);

  const port = config.get<Configuration['port']>('port');
  const isProduction = config.get<Configuration['isProduction']>('isProduction');

  app.useLogger(new WinstonLogger(logger));
  app.enableCors();

  await app.listen(port, () => {
    logger.debug('===================');
    logger.info(`Listening on ${port}, mode: ${isProduction ? 'prod' : 'dev'}`);
    logger.debug('===================');
  });
}
bootstrap();
