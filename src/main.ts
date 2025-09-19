import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import { join } from 'path'; // Add this import statement
import * as express from 'express';
import * as process from 'process';



async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes( new ValidationPipe({
      transform: true, // Active la transformation automatique
      transformOptions: {
        enableImplicitConversion: true, // Active la conversion implicite
      },
    }),)
  app.use(helmet());
  if (process.env.APP_STATUS == "DEV") {
    // Swagger documentation si on n'est pas en production
    const config = new DocumentBuilder()
      .setTitle('JEUNESSE-APP API')
      .setDescription('API(s) pour la gestion des données de JEUNESSE-APP')
      .setVersion('1.0')
      .addTag('JEUNESSE-APP - Documentation')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('doc', app, document);
  } else {
    // Ajoutez cette ligne pour activer CORS pour votre application
    app.enableCors({
      origin: ['', '',],
    });
  }

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  await app.listen(process.env.PORT || 4000);
  // Obtenez l'URL de l'application
  const url = await app.getUrl();
  // Ajoutez cette URL dans un service partagé ou dans une configuration globale
  app.get(ConfigService).set('APP_URL', url);
}
bootstrap();