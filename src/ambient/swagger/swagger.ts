import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Cosmetology')
  .setDescription('The cosmetology API')
  .setVersion('1.0')
  .build();

export const useSwagger = (app: INestApplication): undefined => {
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'swagger/json',
  });
};
