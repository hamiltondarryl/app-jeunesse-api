import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CSRF_COOKIE, SESSION_COOKIE } from '../auth-cookie';

describe('JwtAuthGuard', () => {
  function context(cookies: Record<string, string>) {
    const cleared: string[] = [];
    const response = {
      clearCookie: (name: string) => cleared.push(name),
    };
    return {
      cleared,
      value: {
        switchToHttp: () => ({
          getRequest: () => ({ cookies }),
          getResponse: () => response,
        }),
      },
    };
  }

  const guard = () => new JwtAuthGuard(new Reflector());

  it('retourne l’utilisateur quand la session est valide', () => {
    const user = { id: '1' };
    expect(guard().handleRequest(null, user, null)).toBe(user);
  });

  it('retire les cookies périmés quand la session est refusée', () => {
    const ctx = context({ [SESSION_COOKIE]: 'ancien-jeton' });
    expect(() => guard().handleRequest(null, false, null, ctx.value as never)).toThrow(UnauthorizedException);
    expect(ctx.cleared).toEqual(expect.arrayContaining([SESSION_COOKIE, CSRF_COOKIE]));
  });

  it('ne touche à rien pour un visiteur sans cookie', () => {
    const ctx = context({});
    expect(() => guard().handleRequest(null, false, null, ctx.value as never)).toThrow(UnauthorizedException);
    expect(ctx.cleared).toEqual([]);
  });

  it('laisse passer une route publique sans jeton', () => {
    const reflector = { getAllAndOverride: () => true } as unknown as Reflector;
    const publicGuard = new JwtAuthGuard(reflector);
    const ctx = { getHandler: () => ({}), getClass: () => ({}) };
    expect(publicGuard.canActivate(ctx as never)).toBe(true);
  });
});
