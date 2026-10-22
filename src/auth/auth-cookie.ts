import { timingSafeEqual } from 'crypto';
import { CookieOptions, Response } from 'express';

export const SESSION_COOKIE = 'jeunesse_session';
export const CSRF_COOKIE = 'jeunesse_csrf';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export function isDevEnvironment(): boolean {
  return process.env.APP_STATUS === 'DEV';
}

export function sessionCookieOptions(): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN?.trim();
  return {
    httpOnly: true,
    secure: !isDevEnvironment(),
    sameSite: 'lax',
    path: '/',
    maxAge: EIGHT_HOURS_MS,
    ...(domain ? { domain } : {}),
  };
}

export function csrfCookieOptions(): CookieOptions {
  return {
    ...sessionCookieOptions(),
    httpOnly: false,
  };
}

export function setAuthCookies(res: Response, token: string, csrfToken: string): void {
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
}

export function clearAuthCookies(res: Response): void {
  const base = sessionCookieOptions();
  const clearOptions = { path: '/', ...(base.domain ? { domain: base.domain } : {}) };
  res.clearCookie(SESSION_COOKIE, clearOptions);
  res.clearCookie(CSRF_COOKIE, clearOptions);
}

export function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
