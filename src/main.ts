import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { flattenValidationErrors } from './common/validation-errors';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { join } from 'path';
import { AppExceptionFilter } from './common/filters/http-exception.filter';
import { csrfMiddleware } from './common/csrf.middleware';
import cookieParser = require('cookie-parser');

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'undefined' || jwtSecret.length < 16) {
    throw new Error('JWT_SECRET doit être défini avec au moins 16 caractères.');
  }

  fs.mkdirSync(join(process.cwd(), 'uploads', 'organisations', 'public'), {
    recursive: true,
  });

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  const http = app.getHttpAdapter().getInstance();
  http.disable('x-powered-by');
  http.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(csrfMiddleware);
  const isDev = process.env.APP_STATUS === 'DEV';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: 'Données invalides. Vérifiez les champs du formulaire.',
          errors: flattenValidationErrors(errors),
        }),
    }),
  );
  app.use(
    helmet({
      hidePoweredBy: true,
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isDev ? false : { maxAge: 15552000, includeSubDomains: true },
      contentSecurityPolicy: isDev
        ? false
        : {
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
              baseUri: ["'none'"],
              formAction: ["'none'"],
            },
          },
    }),
  );

  app.enableCors({
    origin: isDev
      ? [frontendUrl, 'http://localhost:4200', 'http://127.0.0.1:4200']
      : [
          'http://pamj-dgjase.com',
          'https://pamj-dgjase.com',
          'http://www.pamj-dgjase.com',
          'https://www.pamj-dgjase.com',
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
  });

  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('API Jeunesse')
      .setDescription('API pour la gestion des associations de jeunesse')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('doc', app, document);
  }

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  const url = await app.getUrl();
  app.get(ConfigService).set('APP_URL', url);
  new Logger('Bootstrap').log(`API disponible sur ${url}`);
}
bootstrap();
