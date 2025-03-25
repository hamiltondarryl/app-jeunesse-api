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
import { EditionModule } from './edition/edition.module';
import { AuthModule } from './auth/auth.module';

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
    EditionModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
