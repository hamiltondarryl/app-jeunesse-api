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
import { uploadsRoot } from './common/uploads';
import { resolvePublicUrls } from './common/public-urls';

async function bootstrap() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'undefined' || jwtSecret.length < 16) {
    throw new Error('JWT_SECRET doit être défini avec au moins 16 caractères.');
  }

  fs.mkdirSync(join(uploadsRoot(), 'organisations', 'public'), {
    recursive: true,
  });

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  const isDev = process.env.APP_STATUS === 'DEV';
  const publicUrls = resolvePublicUrls();
  const frontendUrl = publicUrls.frontendUrl;
  const corsOrigins = isDev
    ? [frontendUrl, 'http://localhost:4200', 'http://127.0.0.1:4200']
    : publicUrls.corsOrigins;

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
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(
    helmet({
      hidePoweredBy: true,
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
      hsts: isDev
        ? false
        : { maxAge: 15552000, includeSubDomains: true, preload: false },
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
  });

  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('JEUNESSE-APP API')
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
  await app.listen(port, '0.0.0.0');
  const url = await app.getUrl();
  app.get(ConfigService).set('APP_URL', url);
  new Logger('Bootstrap').log(`API disponible sur ${url}`);
}
bootstrap();
