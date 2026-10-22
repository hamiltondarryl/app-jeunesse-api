import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { clearAuthCookies, SESSION_COOKIE } from '../auth-cookie';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any, context?: ExecutionContext) {
    if (err || !user) {
      // Une session expirée ou révoquée laisse des cookies périmés : on les retire.
      const http = context?.switchToHttp();
      const request = http?.getRequest();
      const response = http?.getResponse();
      if (request?.cookies?.[SESSION_COOKIE] && response) {
        clearAuthCookies(response);
      }
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
