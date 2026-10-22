import { SESSION_COOKIE, CSRF_COOKIE, setAuthCookies, clearAuthCookies, tokensMatch } from './auth-cookie';

describe('cookies de session', () => {
  function response() {
    const cookies: Record<string, { value: string; options: Record<string, unknown> }> = {};
    return {
      cookies,
      cookie(name: string, value: string, options: Record<string, unknown>) {
        cookies[name] = { value, options };
      },
      clearCookie(name: string) {
        delete cookies[name];
      },
    };
  }

  const previous = process.env.APP_STATUS;

  afterEach(() => {
    process.env.APP_STATUS = previous;
  });

  it('pose un cookie de session inaccessible au script et un jeton CSRF lisible', () => {
    process.env.APP_STATUS = 'DEV';
    const res = response();
    setAuthCookies(res as never, 'jeton-session', 'jeton-csrf');

    expect(res.cookies[SESSION_COOKIE].value).toBe('jeton-session');
    expect(res.cookies[SESSION_COOKIE].options.httpOnly).toBe(true);
    expect(res.cookies[SESSION_COOKIE].options.sameSite).toBe('lax');
    expect(res.cookies[CSRF_COOKIE].options.httpOnly).toBe(false);
    expect(res.cookies[CSRF_COOKIE].value).toBe('jeton-csrf');
  });

  it('marque le cookie sécurisé hors développement', () => {
    process.env.APP_STATUS = 'PROD';
    const res = response();
    setAuthCookies(res as never, 'jeton', 'csrf');
    expect(res.cookies[SESSION_COOKIE].options.secure).toBe(true);
  });

  it('retire les deux cookies', () => {
    const res = response();
    setAuthCookies(res as never, 'jeton', 'csrf');
    clearAuthCookies(res as never);
    expect(res.cookies[SESSION_COOKIE]).toBeUndefined();
    expect(res.cookies[CSRF_COOKIE]).toBeUndefined();
  });

  it('compare les jetons sans accepter une longueur différente', () => {
    expect(tokensMatch('abc', 'abc')).toBe(true);
    expect(tokensMatch('abc', 'abd')).toBe(false);
    expect(tokensMatch('abc', 'abcd')).toBe(false);
  });
});
