import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WinstonLogger } from 'nest-winston';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './ambient/config/config.types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); 
  const logger = app.get('lolkek');
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
