import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { CSRF_COOKIE, SESSION_COOKIE, tokensMatch } from '../auth/auth-cookie';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_PREFIXES = [
  '/api/auth/login-admin',
  '/api/auth/forgot-password',
  '/api/organisation/inscription',
];

export function createCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const path = req.path || req.url.split('?')[0];
  if (EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    next();
    return;
  }

  if (!req.cookies?.[SESSION_COOKIE]) {
    next();
    return;
  }

  const cookieToken = String(req.cookies?.[CSRF_COOKIE] || '');
  const headerToken = String(req.get('x-csrf-token') || '');
  if (!cookieToken || !headerToken || !tokensMatch(cookieToken, headerToken)) {
    res.status(403).json({
      statusCode: 403,
      message: 'Jeton de sécurité invalide.',
      error: 'Requête invalide',
    });
    return;
  }

  next();
}
