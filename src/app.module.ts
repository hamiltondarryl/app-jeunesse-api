import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AuthModule } from './auth/auth.module';
import { OrganisationModule } from './organisation/organisation.module';
import { DomaineModule } from './domaine/domaine.module';
import { DepartementModule } from './departement/departement.module';
import { ProvinceModule } from './province/province.module';
import { diskStorage } from 'multer';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import { DashbordModule } from './dashbord/dashbord.module';
import { FilesModule } from './files/files.module';
import { ReferentielModule } from './referentiel/referentiel.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: String(process.env.MAIL_HOST || 'localhost'),
        auth: process.env.MAIL_USER
          ? {
              user: String(process.env.MAIL_USER),
              pass: String(process.env.MAIL_PASS),
            }
          : undefined,
        port: Number(process.env.MAIL_PORT) || 587,
        tls: {
          rejectUnauthorized: process.env.APP_STATUS !== 'DEV',
        },
        secure: process.env.MAIL_SECURE === 'true',
      },
    }),
    MailModule,
    UserModule,
    RoleModule,
    PermissionModule,
    ActivityLogModule,
    AuthModule,
    OrganisationModule,
    DomaineModule,
    DepartementModule,
    ProvinceModule,
    DashbordModule,
    ReferentielModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
