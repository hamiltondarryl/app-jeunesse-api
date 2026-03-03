import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    MailerModule.forRoot({
      transport: {
        host: String(process.env.MAIL_HOST),
        auth: {
          user: String(process.env.MAIL_USER),
          pass: String(process.env.MAIL_PASS),
        },
        port: Number(process.env.MAIL_PORT),
        tls: {
          rejectUnauthorized: false, // Ignorer les erreurs de certificat (à utiliser avec précaution)
        },
        connectionTimeout: 100000,
        greetingTimeout: 100000, // Délai d'attente pour la réponse du serveur
        socketTimeout: 100000,
        debug: true,
        secure: false,
      },
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
