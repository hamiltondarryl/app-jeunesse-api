import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';

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
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
