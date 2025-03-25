import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  controllers: [AuthController, ],
  providers: [AuthService, AuthService, PrismaService, JwtService, JwtStrategy, ActivityLogService],
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global : true,
      secretOrPrivateKey :  String(process.env.JWT_SECRET),
      secret: String(process.env.JWT_SECRET),
      signOptions: { expiresIn: '1d' }
    })
  ]
})
export class AuthModule {}
