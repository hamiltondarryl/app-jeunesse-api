import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as process from 'process';
import * as dotenv from 'dotenv';
import { SESSION_COOKIE } from './auth-cookie';
dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService, private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.[SESSION_COOKIE] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: String(process.env.JWT_SECRET),
    });
  }

  async validate(payload: any) {
    const tokenVersion = typeof payload.tv === 'number' ? payload.tv : 0;
    const user = await this.authService.validateUser(payload.id, tokenVersion);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}