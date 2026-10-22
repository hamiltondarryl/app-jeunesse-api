import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

function cookieExtractor(req: Request): string | null {
  const header = req?.headers?.cookie;
  if (!header) {
    return null;
  }
  const match = header
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('access_token='));
  return match ? decodeURIComponent(match.slice('access_token='.length)) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
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
