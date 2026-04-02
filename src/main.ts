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
import { ResponseInterceptor } from './common/interceptors/response.interceptor';



async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

    // ✅ Ajouter l'interceptor global AVANT les autres
  app.useGlobalInterceptors(new ResponseInterceptor());

  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({
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
      origin: [
        'http://pamj-dgjase.com',
        'https://pamj-dgjase.com',
        'http://www.pamj-dgjase.com',
        'https://www.pamj-dgjase.com',
        'http://187.124.32.233'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods'
      ],
      credentials: true,  // Si vous utilisez des cookies/sessions
      preflightContinue: false,
      optionsSuccessStatus: 204
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