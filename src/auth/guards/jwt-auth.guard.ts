import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { clearAuthCookies, SESSION_COOKIE } from '../auth-cookie';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
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
