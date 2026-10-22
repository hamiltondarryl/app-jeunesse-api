import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, JwtFromRequestFunction, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { SESSION_COOKIE } from './auth-cookie';

const fromSessionCookie: JwtFromRequestFunction = (request: Request) =>
  request?.cookies?.[SESSION_COOKIE] ?? null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    // L’en-tête Bearer ne sert qu’à Swagger en développement ; en production seule la session par cookie est acceptée.
    const extractors = configService.get('APP_STATUS') === 'DEV'
      ? [fromSessionCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]
      : [fromSessionCookie];
    super({
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      ignoreExpiration: false,
      secretOrKey: String(configService.get('JWT_SECRET')),
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
